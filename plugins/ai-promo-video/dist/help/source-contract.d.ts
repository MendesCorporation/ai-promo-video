import type { HelpEntry } from './catalog.js';
export interface SourceApiContract {
    exportName: string;
    sourceFile?: string;
    typeDeclaration?: string;
    callSignature?: string;
    note?: string;
}
export declare function sourceApiContracts(exportNames: string[]): Promise<SourceApiContract[]>;
export declare function attachSourceContracts<T extends {
    mode?: string;
    help?: HelpEntry;
}>(result: T): Promise<T>;
