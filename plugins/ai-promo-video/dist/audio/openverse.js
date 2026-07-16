import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const API = 'https://api.openverse.org/v1/audio/';
const SAFE_LICENSES = new Set(['cc0', 'pdm', 'by']);
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';
function normalize(item) {
    return {
        provider: 'openverse',
        id: item.id,
        title: item.title || 'Untitled track',
        creator: item.creator,
        duration: item.duration ? item.duration / 1000 : undefined,
        license: item.license,
        licenseUrl: item.license_url,
        attribution: item.attribution,
        tags: item.tags?.map((tag) => tag.name).filter((name) => Boolean(name)) ?? [],
        downloadUrl: item.url,
        landingUrl: item.foreign_landing_url,
        selectable: SAFE_LICENSES.has(item.license.toLowerCase()) && Boolean(item.url),
    };
}
async function apiJson(url) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok)
        throw new Error(`Openverse request failed (${response.status}): ${await response.text()}`);
    return response.json();
}
export async function searchOpenverseMusic(options) {
    const url = new URL(API);
    url.searchParams.set('q', options.query);
    url.searchParams.set('license', (options.licenses ?? ['cc0', 'pdm', 'by']).join(','));
    url.searchParams.set('page_size', String(Math.min(50, Math.max(1, options.pageSize ?? 12))));
    url.searchParams.set('mature', 'false');
    if (options.source)
        url.searchParams.set('source', options.source);
    const payload = await apiJson(url.toString());
    return (payload.results ?? []).map(normalize).filter((result) => result.selectable
        && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
        && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration));
}
function extension(item) {
    const declared = item.filetype?.toLowerCase();
    if (declared && /^[a-z0-9]+$/.test(declared))
        return `.${declared}`;
    const fromUrl = item.url ? extname(new URL(item.url).pathname).toLowerCase() : '';
    return fromUrl || '.mp3';
}
export async function downloadOpenverseMusic(id, outputDir) {
    const item = await apiJson(`${API}${encodeURIComponent(id)}/`);
    const result = normalize(item);
    if (!result.selectable || !item.url)
        throw new Error(`Track ${id} is missing a downloadable URL or uses an unsupported license: ${item.license}`);
    const response = await fetch(item.url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok)
        throw new Error(`Music download failed (${response.status})`);
    const declaredBytes = Number(response.headers.get('content-length') ?? 0);
    if (declaredBytes > 100 * 1024 * 1024)
        throw new Error('Music file exceeds the 100 MB safety limit');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 100 * 1024 * 1024)
        throw new Error('Music file exceeds the 100 MB safety limit');
    const targetDir = resolve(outputDir);
    await mkdir(targetDir, { recursive: true });
    const path = join(targetDir, `openverse-${item.id}${extension(item)}`);
    await writeFile(path, bytes);
    const metadataPath = `${path}.json`;
    await writeFile(metadataPath, `${JSON.stringify({ ...result, localPath: path, downloadedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
    const creditsPath = join(targetDir, 'credits.json');
    let credits = [];
    try {
        const parsed = JSON.parse(await readFile(creditsPath, 'utf8'));
        if (Array.isArray(parsed))
            credits = parsed;
    }
    catch {
        // Start a new credits manifest.
    }
    const withoutCurrent = credits.filter((entry) => entry.id !== result.id);
    withoutCurrent.push({ id: result.id, title: result.title, creator: result.creator, license: result.license, licenseUrl: result.licenseUrl, attribution: result.attribution, landingUrl: result.landingUrl, localPath: path });
    await writeFile(creditsPath, `${JSON.stringify(withoutCurrent, null, 2)}\n`, 'utf8');
    return { ...result, localPath: path };
}
//# sourceMappingURL=openverse.js.map