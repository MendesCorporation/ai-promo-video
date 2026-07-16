import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { parseSync } from 'subtitle';
function roundTime(value) {
    return Math.round(value * 1000) / 1000;
}
function cleanCaptionText(text) {
    return text
        .replace(/<v\s+[^>]+>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function wordWeight(word) {
    const letters = Array.from(word.replace(/[^\p{L}\p{N}]/gu, '')).length;
    const pause = /[.!?…]$/.test(word) ? 1.2 : /[,;:]$/.test(word) ? 0.55 : 0;
    return Math.max(1, letters) + pause;
}
export function interpolateCueWords(text, start, end) {
    const words = cleanCaptionText(text).split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return [];
    const duration = Math.max(0, end - start);
    const weights = words.map(wordWeight);
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    let cursor = start;
    return words.map((word, index) => {
        const wordStart = cursor;
        const wordEnd = index === words.length - 1 ? end : cursor + duration * (weights[index] / totalWeight);
        cursor = wordEnd;
        return { text: word, start: roundTime(wordStart), end: roundTime(wordEnd) };
    });
}
function normalizeJsonCue(cue, index) {
    if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end))
        throw new Error(`Caption cue ${index + 1} requires numeric start and end times in seconds`);
    const suppliedWords = Array.isArray(cue.words) && cue.words.length > 0;
    const text = cleanCaptionText(cue.text ?? cue.words?.map((word) => word.text).join(' ') ?? '');
    const words = suppliedWords
        ? cue.words.map((word) => ({ ...word, text: cleanCaptionText(word.text), start: roundTime(word.start), end: roundTime(word.end) }))
        : interpolateCueWords(text, cue.start, cue.end);
    return {
        id: cue.id || `cue-${index + 1}`,
        start: roundTime(cue.start),
        end: roundTime(cue.end),
        text,
        ...(cue.speaker ? { speaker: cue.speaker } : {}),
        precision: cue.precision ?? (suppliedWords ? 'word-exact' : 'cue-interpolated'),
        words,
    };
}
export function assessCaptionTiming(cues) {
    const issues = [];
    let previousEnd = -Infinity;
    let maxCharactersPerSecond = 0;
    let approximateWords = 0;
    for (const cue of cues) {
        const duration = cue.end - cue.start;
        const charactersPerSecond = duration > 0 ? cue.text.length / duration : Infinity;
        maxCharactersPerSecond = Math.max(maxCharactersPerSecond, charactersPerSecond);
        if (duration <= 0)
            issues.push({ severity: 'error', code: 'invalid-duration', cueId: cue.id, message: 'Cue end must be after its start.' });
        if (cue.start < previousEnd - 0.02)
            issues.push({ severity: 'warning', code: 'overlap', cueId: cue.id, message: 'Cue overlaps the preceding cue.' });
        if (duration > 7)
            issues.push({ severity: 'warning', code: 'long-cue', cueId: cue.id, message: 'Cue remains unchanged for more than seven seconds.' });
        if (charactersPerSecond > 24)
            issues.push({ severity: 'warning', code: 'reading-speed', cueId: cue.id, message: `Reading speed is ${charactersPerSecond.toFixed(1)} characters per second.` });
        if (cue.text.length > 84)
            issues.push({ severity: 'warning', code: 'long-copy', cueId: cue.id, message: 'Cue copy is likely too long for a kinetic two-line caption.' });
        if (cue.words.length > 14)
            issues.push({ severity: 'warning', code: 'word-density', cueId: cue.id, message: 'Split this cue into smaller semantic phrases before animating it.' });
        if (cue.precision === 'cue-interpolated')
            approximateWords += cue.words.length;
        for (const word of cue.words) {
            if (word.end <= word.start)
                issues.push({ severity: 'error', code: 'invalid-word-duration', cueId: cue.id, message: `Word “${word.text}” has no positive duration.` });
            if (word.start < cue.start - 0.02 || word.end > cue.end + 0.02)
                issues.push({ severity: 'error', code: 'word-outside-cue', cueId: cue.id, message: `Word “${word.text}” falls outside its cue.` });
            if (word.end - word.start < 0.055)
                issues.push({ severity: 'warning', code: 'fast-word', cueId: cue.id, message: `Word “${word.text}” is visible for less than 55 ms.` });
        }
        previousEnd = Math.max(previousEnd, cue.end);
    }
    if (approximateWords > 0)
        issues.push({ severity: 'info', code: 'approximate-word-timing', message: `${approximateWords} word timings were interpolated from cue timing and must not be described as exact speech alignment.` });
    return {
        passed: !issues.some((issue) => issue.severity === 'error'),
        issues,
        metrics: {
            cues: cues.length,
            words: cues.reduce((sum, cue) => sum + cue.words.length, 0),
            approximateWords,
            maxCharactersPerSecond: Number.isFinite(maxCharactersPerSecond) ? roundTime(maxCharactersPerSecond) : 0,
        },
    };
}
function buildDocument(source, cues) {
    const precisions = new Set(cues.map((cue) => cue.precision));
    return {
        version: 1,
        source,
        duration: roundTime(cues.reduce((maximum, cue) => Math.max(maximum, cue.end), 0)),
        precision: precisions.size > 1 ? 'mixed' : cues[0]?.precision ?? 'cue-interpolated',
        cues,
        qa: assessCaptionTiming(cues),
    };
}
function parseJsonCaptions(value, source) {
    const candidate = value;
    const cues = Array.isArray(candidate) ? candidate : candidate?.cues;
    if (!Array.isArray(cues))
        throw new Error('Caption JSON must be an array of cues or an object with a cues array');
    return buildDocument(source, cues.map(normalizeJsonCue));
}
export async function prepareCaptionTiming(options) {
    const inputPath = resolve(options.inputPath);
    const source = await readFile(inputPath, 'utf8');
    const extension = extname(inputPath).toLowerCase();
    const document = extension === '.json'
        ? parseJsonCaptions(JSON.parse(source), inputPath)
        : buildDocument(inputPath, parseSync(source)
            .filter((node) => node.type === 'cue')
            .map((node, index) => normalizeJsonCue({
            id: `cue-${index + 1}`,
            start: node.data.start / 1000,
            end: node.data.end / 1000,
            text: node.data.text,
        }, index)));
    if (!options.outputPath)
        return document;
    const outputPath = resolve(options.outputPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return { ...document, outputPath };
}
export async function reviewCaptionTiming(path) {
    const value = JSON.parse(await readFile(resolve(path), 'utf8'));
    return parseJsonCaptions(value, resolve(path)).qa;
}
//# sourceMappingURL=timing.js.map