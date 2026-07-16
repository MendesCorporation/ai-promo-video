export declare function readJson<T>(path: string): Promise<T>;
export declare function writeJson(path: string, value: unknown): Promise<void>;
export declare function resolveFrom(baseFile: string, candidate: string): string;
export declare function fileToDataUri(path: string): Promise<string>;
