import { access, readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, parse, resolve } from 'node:path';

export interface DeliveryCleanupResult {
  outputDir: string;
  kept: string[];
  removed: string[];
}

export async function cleanDeliveryOutput(outputDir: string, keepFiles: string[]): Promise<DeliveryCleanupResult> {
  const root = resolve(outputDir);
  if (root === parse(root).root || root === resolve(homedir())) throw new Error('Refusing to clean a filesystem root or home directory');
  const keep = [...new Set(keepFiles)];
  if (keep.length === 0) throw new Error('At least one final deliverable must be kept');
  if (keep.some((name) => !name || basename(name) !== name || name === '.' || name === '..')) {
    throw new Error('keepFiles must contain direct filenames, not paths');
  }
  for (const name of keep) await access(join(root, name));
  const entries = await readdir(root, { withFileTypes: true });
  const removed: string[] = [];
  for (const entry of entries) {
    if (keep.includes(entry.name)) continue;
    await rm(join(root, entry.name), { recursive: true, force: true });
    removed.push(entry.name);
  }
  return { outputDir: root, kept: keep.sort(), removed: removed.sort() };
}
