export type AdvancedDiagnosticStage = 'source-preflight' | 'typecheck-preflight' | 'renderer';
export interface AdvancedDiagnostic {
    stage: AdvancedDiagnosticStage;
    severity: 'error' | 'warning';
    code: string;
    message: string;
    file?: string;
    relativeFile?: string;
    line?: number;
    column?: number;
    codeFrame?: string;
    suggestion?: string;
    helpTarget?: string;
}
export interface AdvancedFailureReport {
    ok: false;
    phase: 'preflight' | 'renderer';
    summary: string;
    diagnostics: AdvancedDiagnostic[];
    rawTail?: string;
}
export declare function createCodeFrame(source: string, line: number, column: number, contextLines?: number): string;
interface LocatedSource {
    file: string;
    line: number;
    column: number;
}
/** Extract authored TypeScript/JavaScript locations from Vite, browser, and Node stacks. */
export declare function extractAdvancedSourceLocations(raw: string, projectFile: string): LocatedSource[];
export declare function rendererFailureReport(summary: string, raw: string, projectFile: string): AdvancedFailureReport;
export declare function formatAdvancedFailureReport(report: AdvancedFailureReport): string;
export declare class AdvancedDiagnosticError extends Error {
    readonly report: AdvancedFailureReport;
    constructor(report: AdvancedFailureReport);
}
export declare function serializeAdvancedError(error: unknown): AdvancedFailureReport;
export {};
