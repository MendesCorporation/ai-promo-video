import { access, readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

export interface ProjectCleanupOptions {
  projectDir?: string;
  temporaryPaths?: string[];
  /**
   * owned removes every output-directory entry except keepFiles.
   * shared verifies keepFiles but never removes sibling outputs.
   * When omitted, output directories outside projectDir default to shared.
   */
  outputMode?: 'owned' | 'shared';
}

export interface DeliveryCleanupResult {
  outputDir: string;
  projectDir?: string;
  outputMode: 'owned' | 'shared';
  kept: string[];
  removed: string[];
  removedProjectArtifacts: string[];
}

const protectedDirectoryNames = new Set([
  '.git',
  'assets',
  'attribution',
  'attributions',
  'captures',
  'fonts',
  'images',
  'licenses',
  'media',
  'music',
  'node_modules',
  'public',
  'reference',
  'references',
  'source',
  'sources',
  'videos',
]);

const generatedDirectoryNames = new Set([
  '.playwright-cli',
  '.vite',
  'audit',
  'audits',
  'autopsy',
  'fragments',
  'music-review',
  'output',
  'outputs',
  'preview',
  'previews',
  'playwright-report',
  'render',
  'render-frames',
  'rendered',
  'renders',
  'review',
  'reviews',
  'source-review',
  'temp',
  'test-results',
  'tmp',
  'visual-review',
]);

function assertSafeRoot(path: string, label: string): void {
  if (path === parse(path).root || path === resolve(homedir())) {
    throw new Error(`Refusing to clean a filesystem root or home directory as ${label}`);
  }
}

function isWithin(root: string, target: string): boolean {
  const child = relative(root, target);
  return child === '' || (!isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`));
}

function generatedDirectoryName(name: string): boolean {
  const normalized = name.toLowerCase();
  if (generatedDirectoryNames.has(normalized)) return true;
  return /^(?:audit|autopsy|preview|review|source-review|visual-review)[-_].+/.test(normalized)
    || /[-_](?:autopsy|preview)$/.test(normalized);
}

function protectedPath(projectRoot: string, target: string): boolean {
  const parts = relative(projectRoot, target).split(sep).filter(Boolean);
  return parts.some((part) => protectedDirectoryNames.has(part.toLowerCase()));
}

function relativeProjectPath(projectRoot: string, target: string): string {
  return relative(projectRoot, target).split(sep).join('/');
}

function collapseDescendants(paths: string[]): string[] {
  const ordered = [...new Set(paths.map((path) => resolve(path)))].sort((left, right) => left.length - right.length);
  const collapsed: string[] = [];
  for (const candidate of ordered) {
    if (collapsed.some((parent) => parent !== candidate && isWithin(parent, candidate))) continue;
    collapsed.push(candidate);
  }
  return collapsed;
}

async function directoryContainsReviewManifest(path: string): Promise<boolean> {
  try {
    return (await readdir(path)).includes('review-manifest.json');
  } catch {
    return false;
  }
}

async function discoverGeneratedArtifacts(projectRoot: string, outputRoot: string): Promise<string[]> {
  const discovered: string[] = [];

  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries) {
      const target = join(directory, entry.name);
      if (target === outputRoot) continue;
      if (isWithin(target, outputRoot)) {
        if (entry.isDirectory()) await walk(target);
        continue;
      }
      if (entry.name === '.DS_Store' || entry.name.endsWith('.render.json')) {
        discovered.push(target);
        continue;
      }
      if (entry.isSymbolicLink()) {
        if (generatedDirectoryName(entry.name)) discovered.push(target);
        continue;
      }
      if (!entry.isDirectory() || protectedPath(projectRoot, target)) continue;
      if (generatedDirectoryName(entry.name) || await directoryContainsReviewManifest(target)) {
        discovered.push(target);
        continue;
      }
      await walk(target);
    }
  };

  await walk(projectRoot);
  return discovered;
}

async function resolveTemporaryPaths(
  projectRoot: string,
  protectedOutputRoot: string | undefined,
  temporaryPaths: string[],
): Promise<string[]> {
  const resolved: string[] = [];
  for (const value of [...new Set(temporaryPaths)]) {
    if (!value || isAbsolute(value)) throw new Error('temporaryPaths must contain project-relative paths');
    const target = resolve(projectRoot, value);
    if (!isWithin(projectRoot, target) || target === projectRoot) {
      throw new Error(`Temporary path escapes the project directory: ${value}`);
    }
    if (protectedOutputRoot && (
      target === protectedOutputRoot
      || isWithin(target, protectedOutputRoot)
      || isWithin(protectedOutputRoot, target)
    )) {
      throw new Error(`Temporary path may not contain or be inside the delivery directory: ${value}`);
    }
    if (protectedPath(projectRoot, target)) {
      throw new Error(`Refusing to remove protected render input path: ${value}`);
    }
    try {
      await access(target);
      resolved.push(target);
    } catch {
      // A previously removed temporary artifact already satisfies cleanup.
    }
  }
  return resolved;
}

export async function cleanDeliveryOutput(
  outputDir: string,
  keepFiles: string[],
  options: ProjectCleanupOptions = {},
): Promise<DeliveryCleanupResult> {
  const root = resolve(outputDir);
  assertSafeRoot(root, 'outputDir');
  const keep = [...new Set(keepFiles)];
  if (keep.length === 0) throw new Error('At least one final deliverable must be kept');
  if (keep.some((name) => !name || basename(name) !== name || name === '.' || name === '..')) {
    throw new Error('keepFiles must contain direct filenames, not paths');
  }

  // Verify every accepted final before discovering or deleting any artifact.
  for (const name of keep) await access(join(root, name));
  const entries = await readdir(root, {withFileTypes: true});

  let projectRoot: string | undefined;
  let projectArtifacts: string[] = [];
  let outputMode: 'owned' | 'shared' = options.outputMode ?? 'owned';
  if (options.projectDir) {
    projectRoot = resolve(options.projectDir);
    assertSafeRoot(projectRoot, 'projectDir');
    const outputInsideProject = isWithin(projectRoot, root);
    outputMode = options.outputMode ?? (outputInsideProject ? 'owned' : 'shared');
    if (outputMode === 'owned' && isWithin(root, projectRoot)) {
      throw new Error('An owned outputDir may not be the project root or contain it');
    }
    const discovered = await discoverGeneratedArtifacts(projectRoot, root);
    const declared = await resolveTemporaryPaths(
      projectRoot,
      outputInsideProject ? root : undefined,
      options.temporaryPaths ?? [],
    );
    projectArtifacts = collapseDescendants([...discovered, ...declared]);
  } else if ((options.temporaryPaths?.length ?? 0) > 0) {
    throw new Error('projectDir is required when temporaryPaths are provided');
  }

  const removed: string[] = [];
  if (outputMode === 'owned') {
    for (const entry of entries) {
      if (keep.includes(entry.name)) continue;
      await rm(join(root, entry.name), {recursive: true, force: true});
      removed.push(entry.name);
    }
  }
  for (const target of projectArtifacts) await rm(target, {recursive: true, force: true});

  return {
    outputDir: root,
    projectDir: projectRoot,
    outputMode,
    kept: keep.sort(),
    removed: removed.sort(),
    removedProjectArtifacts: projectRoot
      ? projectArtifacts.map((path) => relativeProjectPath(projectRoot!, path)).sort()
      : [],
  };
}
