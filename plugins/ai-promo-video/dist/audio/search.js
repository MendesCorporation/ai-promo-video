import { access, readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import ffprobeStatic from 'ffprobe-static';
import { audioDirectory, loadAudioCatalog } from './catalog.js';
import { runCommand } from '../utils/process.js';
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus']);
async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const output = [];
    for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory())
            output.push(...await walk(path));
        else if (AUDIO_EXTENSIONS.has(extname(entry.name).toLowerCase()))
            output.push(path);
    }
    return output;
}
async function duration(path) {
    try {
        const result = await runCommand(ffprobeStatic.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path], { quiet: true });
        const seconds = Number(JSON.parse(result.stdout).format?.duration);
        return Number.isFinite(seconds) ? seconds : undefined;
    }
    catch {
        return undefined;
    }
}
async function sidecar(path) {
    for (const candidate of [`${path}.json`, join(path, '..', `${basename(path, extname(path))}.json`)]) {
        try {
            await access(candidate);
            return JSON.parse(await readFile(candidate, 'utf8'));
        }
        catch {
            // Sidecar metadata is optional.
        }
    }
    return {};
}
function matches(result, query) {
    if (!query)
        return true;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = `${result.title} ${result.creator ?? ''} ${result.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
}
export async function searchLocalMusic(options = {}) {
    const bundled = options.includeBundled === true
        ? await Promise.all((await loadAudioCatalog()).tracks.map(async (track) => ({
            provider: 'bundled',
            id: track.id,
            title: track.title,
            duration: await duration(join(audioDirectory(), track.file)),
            license: track.license,
            licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
            attribution: `${track.title} — AI Promo Video contributors — CC0-1.0`,
            tags: track.mood,
            localPath: join(audioDirectory(), track.file),
            selectable: true,
        })))
        : [];
    const local = [];
    for (const directory of options.directories ?? []) {
        for (const path of await walk(resolve(directory)).catch(() => [])) {
            const metadata = await sidecar(path);
            const license = String(metadata.license ?? 'unknown');
            local.push({
                provider: 'local',
                id: path,
                title: String(metadata.title ?? basename(path, extname(path))),
                creator: metadata.creator ? String(metadata.creator) : undefined,
                duration: typeof metadata.duration === 'number' ? metadata.duration : await duration(path),
                license,
                licenseUrl: metadata.licenseUrl ? String(metadata.licenseUrl) : undefined,
                attribution: metadata.attribution ? String(metadata.attribution) : undefined,
                tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : basename(path, extname(path)).split(/[-_ ]+/),
                localPath: path,
                selectable: license !== 'unknown' || options.allowUnknownLicense === true,
            });
        }
    }
    return [...(options.includeBundled === true ? bundled : []), ...local].filter((result) => matches(result, options.query)
        && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
        && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration));
}
//# sourceMappingURL=search.js.map