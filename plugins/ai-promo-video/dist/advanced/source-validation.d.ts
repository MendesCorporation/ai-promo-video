import { AdvancedDiagnosticError } from './diagnostics.js';
export type AdvancedSourceIssueCode = 'REV011_NESTED_JSX_FRAGMENT_MAP' | 'REV011_NESTED_JSX_ARRAY_MAP';
export interface AdvancedSourceIssue {
    code: AdvancedSourceIssueCode;
    severity: 'error';
    file: string;
    line: number;
    column: number;
    message: string;
    suggestion: string;
    helpTarget: 'topic:revideo-scene-tree';
}
export interface AdvancedSourceValidationResult {
    valid: boolean;
    projectFile: string;
    filesChecked: string[];
    issues: AdvancedSourceIssue[];
}
export declare function validateRevideoSceneSource(source: string, file?: string): AdvancedSourceIssue[];
export declare function validateAdvancedProjectSource(projectFileInput: string): Promise<AdvancedSourceValidationResult>;
export declare class AdvancedSourceValidationError extends AdvancedDiagnosticError {
    readonly validation: AdvancedSourceValidationResult;
    constructor(validation: AdvancedSourceValidationResult);
}
