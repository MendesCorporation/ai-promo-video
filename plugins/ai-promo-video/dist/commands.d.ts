export declare function validateSpec(path: string, kind?: 'video' | 'capture'): Promise<Record<string, unknown>>;
export declare function runCommandByName(name: string, args: string[], flags: Record<string, string | boolean>): Promise<unknown>;
