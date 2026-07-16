import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function audioDirectory() {
    return fileURLToPath(new URL('../../assets/audio/', import.meta.url));
}
export async function loadAudioCatalog() {
    const path = fileURLToPath(new URL('../../assets/audio/catalog.json', import.meta.url));
    return JSON.parse(await readFile(path, 'utf8'));
}
export async function listAudioTracks(filters = {}) {
    const catalog = await loadAudioCatalog();
    return catalog.tracks.filter((track) => {
        const matchesMood = !filters.mood || track.mood.some((mood) => mood.toLowerCase().includes(filters.mood.toLowerCase()));
        const matchesIntensity = filters.maxIntensity === undefined || track.intensity <= filters.maxIntensity;
        return matchesMood && matchesIntensity;
    });
}
export async function resolveAudioTrack(id, baseFile) {
    const catalog = await loadAudioCatalog();
    const track = catalog.tracks.find((candidate) => candidate.id === id);
    const path = track
        ? fileURLToPath(new URL(`../../assets/audio/${track.file}`, import.meta.url))
        : isAbsolute(id)
            ? id
            : baseFile
                ? resolve(dirname(baseFile), id)
                : resolve(id);
    try {
        await access(path);
    }
    catch {
        if (track)
            throw new Error(`Audio track ${id} has not been generated. Run \"npm run audio:generate\" first.`);
        throw new Error(`Music file not found: ${path}`);
    }
    return path;
}
//# sourceMappingURL=catalog.js.map