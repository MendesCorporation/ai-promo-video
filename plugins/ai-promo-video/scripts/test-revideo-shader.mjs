#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ffprobeStatic from 'ffprobe-static';

const workspaceDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = join(
  workspaceDirectory,
  'test',
  'fixtures',
  'revideo-shader',
  'project.tsx',
);
const output = join(tmpdir(), 'ai-promo-video-revideo-shader-test.mp4');

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', chunk => {
      stdout += chunk;
      if (options.echo !== false) process.stdout.write(chunk);
    });
    child.stderr?.on('data', chunk => {
      stderr += chunk;
      if (options.echo !== false) process.stderr.write(chunk);
    });
    child.on('error', rejectPromise);
    child.on('close', code => {
      if (code === 0) resolvePromise({stdout, stderr});
      else rejectPromise(new Error(`${command} exited with code ${code}\n${stderr}`));
    });
  });
}

await run(
  process.execPath,
  [join(workspaceDirectory, 'scripts', 'apply-revideo-patches.mjs'), '--check'],
  {cwd: workspaceDirectory},
);
await rm(output, {force: true});
await run(
  process.execPath,
  [
    join(workspaceDirectory, 'dist', 'cli.js'),
    'advanced:render',
    fixture,
    '--output',
    output,
    '--workers',
    '2',
  ],
  {cwd: workspaceDirectory},
);

const probe = await run(
  ffprobeStatic.path,
  [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_name,width,height',
    '-of',
    'json',
    output,
  ],
  {cwd: workspaceDirectory, echo: false},
);
const metadata = JSON.parse(probe.stdout);
const stream = metadata.streams?.[0];
const duration = Number(metadata.format?.duration);

if (
  stream?.codec_name !== 'h264' ||
  stream?.width !== 480 ||
  stream?.height !== 270 ||
  !Number.isFinite(duration) ||
  duration < 1 ||
  duration > 2
) {
  throw new Error(
    `Unexpected shader regression render metadata: ${JSON.stringify(metadata)}`,
  );
}

await readFile(output);
process.stdout.write(
  `[ai-promo-video] Shader regression render passed (${duration.toFixed(2)}s): ${output}\n`,
);
