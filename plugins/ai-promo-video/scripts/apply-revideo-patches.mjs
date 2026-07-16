#!/usr/bin/env node

import {rm, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const EXPECTED_REVIDEO_VERSION = '0.11.0';
const PATCH_NAME = 'revideo-0.11-shader-scene-context';
const DIAGNOSTIC_PATCH_NAME = 'revideo-0.11-browser-error-stack';
const checkOnly = process.argv.includes('--check');
const workspaceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function occurrences(source, needle) {
  return source.split(needle).length - 1;
}

function applyExactReplacement(source, before, after, label) {
  const beforeCount = occurrences(source, before);
  const afterCount = occurrences(source, after);

  if (beforeCount === 1 && afterCount === 0) {
    return {source: source.replace(before, after), changed: true};
  }

  if (beforeCount === 0 && afterCount === 1) {
    return {source, changed: false};
  }

  throw new Error(
    `${PATCH_NAME}: unexpected ${label} source shape ` +
      `(original=${beforeCount}, patched=${afterCount}). ` +
      'Refusing to modify an unknown Revideo build.',
  );
}

async function resolvePackage(packageName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  return {
    directory: dirname(packageJsonPath),
    packageJson,
  };
}

async function main() {
  const revideo2d = await resolvePackage('@revideo/2d');
  const revideoCore = await resolvePackage('@revideo/core');
  const revideoRenderer = await resolvePackage('@revideo/renderer');
  if (revideo2d.packageJson.version !== EXPECTED_REVIDEO_VERSION) {
    throw new Error(
      `${PATCH_NAME}: expected @revideo/2d ${EXPECTED_REVIDEO_VERSION}, ` +
        `found ${revideo2d.packageJson.version}. Review or remove the local patch ` +
        'before changing the pinned Revideo version.',
    );
  }
  for (const dependency of [revideoCore, revideoRenderer]) {
    if (dependency.packageJson.version !== EXPECTED_REVIDEO_VERSION) {
      throw new Error(
        `${DIAGNOSTIC_PATCH_NAME}: expected Revideo ${EXPECTED_REVIDEO_VERSION}, ` +
          `found ${dependency.packageJson.version}. Review the local patch before changing the pinned Revideo version.`,
      );
    }
  }

  const nodePath = join(revideo2d.directory, 'lib', 'components', 'Node.js');
  const shaderConfigPath = join(
    revideo2d.directory,
    'lib',
    'partials',
    'ShaderConfig.js',
  );
  const loggerPath = join(revideoCore.directory, 'lib', 'app', 'Logger.js');
  const renderClientPath = join(revideoRenderer.directory, 'lib', 'client', 'render.js');

  let nodeSource = await readFile(nodePath, 'utf8');
  let shaderConfigSource = await readFile(shaderConfigPath, 'utf8');
  let loggerSource = await readFile(loggerPath, 'utf8');
  let renderClientSource = await readFile(renderClientPath, 'utf8');
  let changed = false;

  const constructorPatch = applyExactReplacement(
    nodeSource,
    `        const scene = useScene2D();\n        [this.key, this.unregister] = scene.registerNode(this, key);`,
    `        const scene = useScene2D();\n        // ${PATCH_NAME}: keep the owning scene for render-time shaders.\n        this.__aiPromoVideoShaderScene = scene;\n        [this.key, this.unregister] = scene.registerNode(this, key);`,
    'Node constructor',
  );
  nodeSource = constructorPatch.source;
  changed ||= constructorPatch.changed;

  const shaderCanvasPatch = applyExactReplacement(
    nodeSource,
    `        const scene = useScene2D();\n        const size = scene.getRealSize();\n        const parentCacheRect = this.parentWorldSpaceCacheBBox();`,
    `        const scene = this.__aiPromoVideoShaderScene;\n        const size = scene.getRealSize();\n        const parentCacheRect = this.parentWorldSpaceCacheBBox();`,
    'Node shaderCanvas',
  );
  nodeSource = shaderCanvasPatch.source;
  changed ||= shaderCanvasPatch.changed;

  const parentCachePatch = applyExactReplacement(
    nodeSource,
    `            new BBox(Vector2.zero, useScene2D().getSize()));`,
    `            new BBox(Vector2.zero, this.__aiPromoVideoShaderScene.getSize()));`,
    'Node parentWorldSpaceCacheBBox',
  );
  nodeSource = parentCachePatch.source;
  changed ||= parentCachePatch.changed;

  const importPatch = applyExactReplacement(
    shaderConfigSource,
    `import { experimentalLog, useLogger, useScene } from '@revideo/core';`,
    `import { experimentalLog, useLogger } from '@revideo/core';`,
    'ShaderConfig import',
  );
  shaderConfigSource = importPatch.source;
  changed ||= importPatch.changed;

  const parserPatch = applyExactReplacement(
    shaderConfigSource,
    `    if (!useScene().experimentalFeatures && result.length > 0) {`,
    `    if (!this.__aiPromoVideoShaderScene.experimentalFeatures && result.length > 0) {`,
    'ShaderConfig scene lookup',
  );
  shaderConfigSource = parserPatch.source;
  changed ||= parserPatch.changed;

  const loggerStackPatch = applyExactReplacement(
    loggerSource,
    `            window.browserError(typeof payload === 'string' ? payload : payload.message);`,
    `            // ${DIAGNOSTIC_PATCH_NAME}: preserve authored browser stacks for structured diagnostics.\n` +
      `            window.browserError(typeof payload === 'string' ? payload : payload.stack ?? payload.message);`,
    'Logger browserError stack',
  );
  loggerSource = loggerStackPatch.source;
  changed ||= loggerStackPatch.changed;

  const renderStackPatch = applyExactReplacement(
    renderClientSource,
    `        window.onRenderFailed(e.message);`,
    `        // ${DIAGNOSTIC_PATCH_NAME}: pass the Vite-authored stack to the Node renderer.\n` +
      `        const error = e instanceof Error ? e : new Error(String(e));\n` +
      `        window.onRenderFailed(error.stack ?? error.message);`,
    'renderer client error stack',
  );
  renderClientSource = renderStackPatch.source;
  changed ||= renderStackPatch.changed;

  if (checkOnly) {
    if (changed) {
      throw new Error(
        `${PATCH_NAME}: patch is required but has not been applied. ` +
          'Run node scripts/apply-revideo-patches.mjs.',
      );
    }
    process.stdout.write(
      `[ai-promo-video] ${PATCH_NAME} and ${DIAGNOSTIC_PATCH_NAME} are applied to Revideo ${EXPECTED_REVIDEO_VERSION}.\n`,
    );
    return;
  }

  if (!changed) {
    process.stdout.write(
      `[ai-promo-video] ${PATCH_NAME} and ${DIAGNOSTIC_PATCH_NAME} are already applied.\n`,
    );
    return;
  }

  await Promise.all([
    writeFile(nodePath, nodeSource, 'utf8'),
    writeFile(shaderConfigPath, shaderConfigSource, 'utf8'),
    writeFile(loggerPath, loggerSource, 'utf8'),
    writeFile(renderClientPath, renderClientSource, 'utf8'),
  ]);

  // Vite may have optimized the unpatched runtime during a previous install.
  const nodeModulesDirectory = dirname(dirname(revideo2d.directory));
  const viteCaches = new Set([
    join(nodeModulesDirectory, '.vite'),
    join(workspaceDirectory, 'node_modules', '.vite'),
    join(process.cwd(), 'node_modules', '.vite'),
  ]);
  await Promise.all(
    [...viteCaches].map(cache => rm(cache, {recursive: true, force: true})),
  );

  process.stdout.write(
    `[ai-promo-video] Applied ${PATCH_NAME} and ${DIAGNOSTIC_PATCH_NAME} to Revideo ${EXPECTED_REVIDEO_VERSION}.\n`,
  );
}

main().catch(error => {
  process.stderr.write(`[ai-promo-video] ${error.message}\n`);
  process.exitCode = 1;
});
