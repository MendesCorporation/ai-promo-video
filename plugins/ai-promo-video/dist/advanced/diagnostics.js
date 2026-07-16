import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function createCodeFrame(source, line, column, contextLines = 1) {
    const lines = source.replaceAll('\r\n', '\n').split('\n');
    const start = Math.max(1, line - contextLines);
    const end = Math.min(lines.length, line + contextLines);
    const numberWidth = String(end).length;
    const output = [];
    for (let current = start; current <= end; current += 1) {
        const marker = current === line ? '>' : ' ';
        output.push(`${marker} ${String(current).padStart(numberWidth, ' ')} | ${lines[current - 1] ?? ''}`);
        if (current === line) {
            output.push(`  ${' '.repeat(numberWidth)} | ${' '.repeat(Math.max(0, column - 1))}^`);
        }
    }
    return output.join('\n');
}
function displayRelative(projectFile, file) {
    const value = relative(dirname(projectFile), file);
    return value || file;
}
function normalizeLocatedFile(candidate, projectFile) {
    let withoutUrl = candidate;
    if (candidate.startsWith('file://')) {
        try {
            withoutUrl = fileURLToPath(candidate);
        }
        catch {
            withoutUrl = candidate.replace(/^file:\/\/\/?/, '');
        }
    }
    return isAbsolute(withoutUrl) ? resolve(withoutUrl) : resolve(dirname(projectFile), withoutUrl);
}
/** Extract authored TypeScript/JavaScript locations from Vite, browser, and Node stacks. */
export function extractAdvancedSourceLocations(raw, projectFile) {
    const locations = [];
    const seen = new Set();
    const patterns = [
        /https?:\/\/[^\s/]+\/@fs(?<file>\/[^()\s?]+?\.(?:tsx?|jsx?))(?:\?[^()\s:]*)?:(?<line>\d+):(?<column>\d+)/g,
        /https?:\/\/[^\s/]+\/(?<file>[^()\s?]+?\.(?:tsx?|jsx?))(?:\?[^()\s:]*)?:(?<line>\d+):(?<column>\d+)/g,
        /(?<file>file:\/\/\/?[A-Za-z]:[\\/][^()\n]+?\.(?:tsx?|jsx?)):(?<line>\d+):(?<column>\d+)/g,
        /(?<![A-Za-z])(?<file>[A-Za-z]:[\\/][^()\n]+?\.(?:tsx?|jsx?)):(?<line>\d+):(?<column>\d+)/g,
        /(?<file>file:\/\/\/[^()\n]+?\.(?:tsx?|jsx?)):(?<line>\d+):(?<column>\d+)/g,
        /(?<file>\/[^()\n]+?\.(?:tsx?|jsx?)):(?<line>\d+):(?<column>\d+)/g,
        /(?:^|[\s(])(?<file>(?:\.{1,2}[\\/])?[A-Za-z0-9_@-][^():\s]*?\.(?:tsx?|jsx?)):(?<line>\d+):(?<column>\d+)/gm,
    ];
    for (const pattern of patterns) {
        for (const match of raw.matchAll(pattern)) {
            const groups = match.groups;
            if (!groups)
                continue;
            const file = normalizeLocatedFile(groups.file, projectFile);
            const line = Number(groups.line);
            const column = Number(groups.column);
            const key = `${file}:${line}:${column}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            locations.push({ file, line, column });
        }
    }
    const projectRoot = dirname(resolve(projectFile));
    const sorted = locations.sort((left, right) => {
        const leftProject = left.file === projectRoot || left.file.startsWith(`${projectRoot}/`) || left.file.startsWith(`${projectRoot}\\`);
        const rightProject = right.file === projectRoot || right.file.startsWith(`${projectRoot}/`) || right.file.startsWith(`${projectRoot}\\`);
        return Number(rightProject) - Number(leftProject);
    });
    const authored = sorted.filter(({ file }) => /\.[cm]?[jt]sx$/i.test(file) && !file.includes('/node_modules/') && !file.includes('\\node_modules\\'));
    const existingAuthored = authored.filter(({ file }) => existsSync(file));
    const selected = existingAuthored.length > 0 ? existingAuthored : authored;
    const seenFiles = new Set();
    return selected.filter(({ file }) => {
        if (seenFiles.has(file))
            return false;
        seenFiles.add(file);
        return true;
    });
}
function rendererCause(summary, raw) {
    const browserMessages = [...raw.matchAll(/Worker\s+\d+:\s+JSHandle:(?!error\b)([^\n]+)/g)]
        .map((match) => match[1].trim())
        .filter(Boolean);
    if (browserMessages.length > 0)
        return `Advanced renderer failed: ${browserMessages.at(-1)}`;
    const errors = [...raw.matchAll(/^Error:\s+([^\n]+)$/gm)]
        .map((match) => match[1].trim())
        .filter((message) => message && !message.includes('exited before completion'));
    return errors.length > 0 ? `Advanced renderer failed: ${errors.at(-1)}` : summary;
}
export function rendererFailureReport(summary, raw, projectFile) {
    const effectiveSummary = rendererCause(summary, raw);
    const causeText = effectiveSummary.replace(/^Advanced renderer failed:\s*/, '');
    const rawTail = raw.trim().slice(-4_000);
    const locations = extractAdvancedSourceLocations(raw, projectFile).slice(0, 8);
    const diagnostics = locations.map(({ file, line: stackLine, column: stackColumn }) => {
        let line = stackLine;
        let column = stackColumn;
        let codeFrame;
        try {
            const source = readFileSync(file, 'utf8');
            const sourceLine = source.replaceAll('\r\n', '\n').split('\n')[line - 1] ?? '';
            if (causeText && !sourceLine.includes(causeText)) {
                const first = source.indexOf(causeText);
                if (first >= 0 && first === source.lastIndexOf(causeText)) {
                    const before = source.slice(0, first).replaceAll('\r\n', '\n');
                    line = before.split('\n').length;
                    column = first - before.lastIndexOf('\n');
                }
            }
            codeFrame = createCodeFrame(source, line, column);
        }
        catch {
            // The stack may refer to Vite's generated module or an already removed file.
        }
        return {
            stage: 'renderer',
            severity: 'error',
            code: 'REVIDEO_RUNTIME',
            message: effectiveSummary,
            file,
            relativeFile: displayRelative(projectFile, file),
            line,
            column,
            ...(codeFrame ? { codeFrame } : {}),
        };
    });
    if (diagnostics.length === 0) {
        diagnostics.push({
            stage: 'renderer',
            severity: 'error',
            code: 'REVIDEO_RUNTIME',
            message: effectiveSummary,
        });
    }
    return {
        ok: false,
        phase: 'renderer',
        summary: effectiveSummary,
        diagnostics,
        ...(rawTail ? { rawTail } : {}),
    };
}
export function formatAdvancedFailureReport(report) {
    const details = report.diagnostics.map((diagnostic) => {
        const location = diagnostic.file
            ? `${diagnostic.relativeFile ?? diagnostic.file}${diagnostic.line ? `:${diagnostic.line}:${diagnostic.column ?? 1}` : ''}`
            : undefined;
        return [
            `- [${diagnostic.code}]${location ? ` ${location}` : ''} ${diagnostic.message}`,
            diagnostic.codeFrame,
            diagnostic.suggestion ? `  Fix: ${diagnostic.suggestion}` : undefined,
            diagnostic.helpTarget ? `  Help: help({target: '${diagnostic.helpTarget}'})` : undefined,
        ].filter(Boolean).join('\n');
    }).join('\n');
    return `${report.summary}\n${details}`;
}
export class AdvancedDiagnosticError extends Error {
    report;
    constructor(report) {
        super(formatAdvancedFailureReport(report));
        this.report = report;
        this.name = 'AdvancedDiagnosticError';
    }
}
export function serializeAdvancedError(error) {
    if (error instanceof AdvancedDiagnosticError)
        return error.report;
    if (error && typeof error === 'object' && 'report' in error) {
        const report = error.report;
        if (report && typeof report === 'object' && 'diagnostics' in report)
            return report;
    }
    const normalized = error instanceof Error ? error : new Error(String(error));
    return {
        ok: false,
        phase: 'renderer',
        summary: normalized.message,
        diagnostics: [{
                stage: 'renderer',
                severity: 'error',
                code: normalized.name || 'RENDER_ERROR',
                message: normalized.message,
            }],
    };
}
//# sourceMappingURL=diagnostics.js.map