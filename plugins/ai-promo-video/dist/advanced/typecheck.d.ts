import { AdvancedDiagnosticError, type AdvancedDiagnostic } from './diagnostics.js';
export interface AdvancedTypecheckResult {
    valid: boolean;
    projectFile: string;
    elapsedMs: number;
    filesChecked: string[];
    diagnostics: AdvancedDiagnostic[];
}
export declare function validateAdvancedProjectTypes(projectFileInput: string): AdvancedTypecheckResult;
export declare class AdvancedTypecheckError extends AdvancedDiagnosticError {
    readonly validation: AdvancedTypecheckResult;
    constructor(validation: AdvancedTypecheckResult);
}
