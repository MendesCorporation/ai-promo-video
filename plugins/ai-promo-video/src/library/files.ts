import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { FreeMediaSearchResult } from '../types.js';

const MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'application/ogg': '.ogv',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

function safeExtension(result: FreeMediaSearchResult): string {
  if (result.downloadUrl) {
    try {
      const extension = extname(new URL(result.downloadUrl).pathname).toLowerCase();
      if (/^\.[a-z0-9]{2,6}$/.test(extension)) return extension === '.jpeg' ? '.jpg' : extension;
    } catch {
      // Fall through to MIME and kind based detection.
    }
  }
  return MIME_EXTENSIONS[result.mimeType ?? ''] ?? (result.kind === 'video' ? '.mp4' : result.kind === 'svg' ? '.svg' : '.png');
}

function safeStem(value: string): string {
  const result = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return result || 'media';
}

async function responseBytes(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new Error(`Media file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB safety limit`);
  if (!response.body) return Buffer.from(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Media file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB safety limit`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export async function downloadFreeMedia(
  result: FreeMediaSearchResult,
  outputDir: string,
  options: { userAgent: string; maxBytes?: number },
): Promise<FreeMediaSearchResult> {
  if (!result.selectable || !result.downloadUrl) {
    throw new Error(`${result.title} is not selectable: ${result.licenseReason ?? 'missing a safe license or download URL'}`);
  }
  const response = await fetch(result.downloadUrl, { headers: { 'User-Agent': options.userAgent } });
  if (!response.ok) throw new Error(`Media download failed (${response.status}): ${response.statusText}`);
  const bytes = await responseBytes(response, options.maxBytes ?? (result.kind === 'video' ? 750 * 1024 * 1024 : 100 * 1024 * 1024));

  const targetDir = resolve(outputDir);
  await mkdir(targetDir, { recursive: true });
  const path = join(targetDir, `${result.provider}-${safeStem(result.title)}-${safeStem(result.id)}${safeExtension(result)}`);
  const downloaded = { ...result, localPath: path };
  await writeFile(path, bytes);
  await writeFile(`${path}.json`, `${JSON.stringify({ ...downloaded, downloadedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');

  const creditsPath = join(targetDir, 'credits.json');
  let credits: unknown[] = [];
  try {
    const parsed = JSON.parse(await readFile(creditsPath, 'utf8')) as unknown;
    if (Array.isArray(parsed)) credits = parsed;
  } catch {
    // Start a new credits manifest.
  }
  const withoutCurrent = credits.filter((entry) => {
    const value = entry as { provider?: string; id?: string; kind?: string };
    return value.provider !== result.provider || value.id !== result.id || value.kind !== result.kind;
  });
  withoutCurrent.push({
    provider: result.provider,
    kind: result.kind,
    id: result.id,
    title: result.title,
    creator: result.creator,
    license: result.license,
    licenseUrl: result.licenseUrl,
    attribution: result.attribution,
    requiresAttribution: result.requiresAttribution,
    requiresShareAlike: result.requiresShareAlike,
    landingUrl: result.landingUrl,
    localPath: path,
  });
  await writeFile(creditsPath, `${JSON.stringify(withoutCurrent, null, 2)}\n`, 'utf8');
  return downloaded;
}
