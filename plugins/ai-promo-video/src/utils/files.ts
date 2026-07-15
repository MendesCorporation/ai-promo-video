import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function resolveFrom(baseFile: string, candidate: string): string {
  return resolve(dirname(baseFile), candidate);
}

export async function fileToDataUri(path: string): Promise<string> {
  const buffer = await readFile(path);
  const mime = mimeForExtension(extname(path));
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function mimeForExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'image/png';
  }
}
