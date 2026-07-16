import { readFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { AdvancedDiagnosticError, createCodeFrame } from './diagnostics.js';
const ignoredDirectories = new Set([
    '.git',
    'dist',
    'node_modules',
    'output',
    'public',
    'review',
]);
/**
 * Mask comments and string literals while preserving offsets and newlines.
 * JSX structure remains intact so diagnostics can point at the authored source.
 */
function maskNonCode(source) {
    const output = [...source];
    let state = 'code';
    let escaped = false;
    const mask = (index) => {
        if (output[index] !== '\n' && output[index] !== '\r')
            output[index] = ' ';
    };
    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        const next = source[index + 1];
        if (state === 'line-comment') {
            if (character === '\n')
                state = 'code';
            else
                mask(index);
            continue;
        }
        if (state === 'block-comment') {
            mask(index);
            if (character === '*' && next === '/') {
                mask(index + 1);
                index += 1;
                state = 'code';
            }
            continue;
        }
        if (state !== 'code') {
            mask(index);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (character === '\\') {
                escaped = true;
                continue;
            }
            if ((state === 'single' && character === "'") ||
                (state === 'double' && character === '"') ||
                (state === 'template' && character === '`'))
                state = 'code';
            continue;
        }
        if (character === '/' && next === '/') {
            mask(index);
            mask(index + 1);
            index += 1;
            state = 'line-comment';
        }
        else if (character === '/' && next === '*') {
            mask(index);
            mask(index + 1);
            index += 1;
            state = 'block-comment';
        }
        else if (character === "'") {
            mask(index);
            state = 'single';
        }
        else if (character === '"') {
            mask(index);
            state = 'double';
        }
        else if (character === '`') {
            mask(index);
            state = 'template';
        }
    }
    return output.join('');
}
function matchingDelimiter(source, openingIndex, opening, closing) {
    let depth = 0;
    for (let index = openingIndex; index < source.length; index += 1) {
        if (source[index] === opening)
            depth += 1;
        else if (source[index] === closing) {
            depth -= 1;
            if (depth === 0)
                return index;
        }
    }
    return -1;
}
function skipWhitespace(source, start) {
    let index = start;
    while (/\s/.test(source[index] ?? ''))
        index += 1;
    return index;
}
function collectionAt(source, start) {
    let index = skipWhitespace(source, start);
    while (source[index] === '(')
        index = skipWhitespace(source, index + 1);
    if (source.startsWith('<>', index) ||
        /^<(?:React\.)?Fragment(?:\s|>)/.test(source.slice(index)))
        return { kind: 'fragment', index };
    if (source[index] === '[') {
        const closing = matchingDelimiter(source, index, '[', ']');
        const contents = source.slice(index + 1, closing < 0 ? index + 1_000 : closing);
        if (/<>|<[A-Z][A-Za-z0-9_.]*(?:\s|\/?>)/.test(contents)) {
            return { kind: 'array', index };
        }
    }
    return undefined;
}
function returnedCollection(callback) {
    const arrow = callback.indexOf('=>');
    if (arrow >= 0) {
        const direct = collectionAt(callback, arrow + 2);
        if (direct)
            return direct;
    }
    let braceDepth = 0;
    for (let index = 0; index < callback.length; index += 1) {
        if (callback[index] === '{')
            braceDepth += 1;
        else if (callback[index] === '}')
            braceDepth -= 1;
        if (braceDepth !== 1 || !callback.startsWith('return', index))
            continue;
        const before = callback[index - 1];
        const after = callback[index + 'return'.length];
        if ((before && /[\w$]/.test(before)) || (after && /[\w$]/.test(after)))
            continue;
        const returned = collectionAt(callback, index + 'return'.length);
        if (returned)
            return returned;
    }
    return undefined;
}
function locationAt(source, index) {
    const before = source.slice(0, index);
    const line = before.split('\n').length;
    const lastNewline = before.lastIndexOf('\n');
    return { line, column: index - lastNewline };
}
export function validateRevideoSceneSource(source, file = 'scene.tsx') {
    const masked = maskNonCode(source);
    const issues = [];
    const mapPattern = /\.map\s*\(/g;
    for (const match of masked.matchAll(mapPattern)) {
        if (match.index === undefined)
            continue;
        const opening = masked.indexOf('(', match.index);
        const closing = matchingDelimiter(masked, opening, '(', ')');
        if (opening < 0 || closing < 0)
            continue;
        const callback = masked.slice(opening + 1, closing);
        const returned = returnedCollection(callback);
        if (!returned)
            continue;
        const absoluteIndex = opening + 1 + returned.index;
        const location = locationAt(source, absoluteIndex);
        const fragment = returned.kind === 'fragment';
        issues.push({
            code: fragment ? 'REV011_NESTED_JSX_FRAGMENT_MAP' : 'REV011_NESTED_JSX_ARRAY_MAP',
            severity: 'error',
            file,
            ...location,
            message: fragment
                ? 'Revideo 0.11 can create refs for a Fragment returned by map() while leaving its nodes detached from the rendered scene tree.'
                : 'Revideo 0.11 can leave JSX nodes detached when map() returns an array and creates a nested child array.',
            suggestion: 'Return one node per map(), use flatMap(), or replace map() with mapSceneNodes() from scene-tree.ts before adding the collection.',
            helpTarget: 'topic:revideo-scene-tree',
        });
    }
    return issues;
}
async function projectTsxFiles(projectFile) {
    const root = dirname(projectFile);
    const files = [];
    async function visit(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (entry.isDirectory() && ignoredDirectories.has(entry.name))
                continue;
            const path = join(directory, entry.name);
            if (entry.isDirectory())
                await visit(path);
            else if (entry.isFile() && extname(entry.name).toLowerCase() === '.tsx')
                files.push(path);
        }
    }
    await visit(root);
    return files.sort();
}
export async function validateAdvancedProjectSource(projectFileInput) {
    const projectFile = resolve(projectFileInput);
    const root = dirname(projectFile);
    const files = await projectTsxFiles(projectFile);
    if (!files.includes(projectFile) && extname(projectFile).toLowerCase() === '.tsx')
        files.unshift(projectFile);
    const issues = (await Promise.all(files.map(async (path) => {
        const file = relative(root, path) || basename(path);
        return validateRevideoSceneSource(await readFile(path, 'utf8'), file);
    }))).flat();
    return { valid: issues.length === 0, projectFile, filesChecked: files.map((path) => relative(root, path) || basename(path)), issues };
}
export class AdvancedSourceValidationError extends AdvancedDiagnosticError {
    validation;
    constructor(validation) {
        const root = dirname(validation.projectFile);
        const report = {
            ok: false,
            phase: 'preflight',
            summary: 'Revideo source validation failed before renderer startup.',
            diagnostics: validation.issues.map((issue) => {
                const file = resolve(root, issue.file);
                let codeFrame;
                try {
                    codeFrame = createCodeFrame(readFileSync(file, 'utf8'), issue.line, issue.column);
                }
                catch {
                    // Source may have been removed between validation and error formatting.
                }
                return {
                    stage: 'source-preflight',
                    severity: issue.severity,
                    code: issue.code,
                    message: issue.message,
                    file,
                    relativeFile: issue.file,
                    line: issue.line,
                    column: issue.column,
                    ...(codeFrame ? { codeFrame } : {}),
                    suggestion: issue.suggestion,
                    helpTarget: issue.helpTarget,
                };
            }),
        };
        super(report);
        this.validation = validation;
        this.name = 'AdvancedSourceValidationError';
    }
}
//# sourceMappingURL=source-validation.js.map