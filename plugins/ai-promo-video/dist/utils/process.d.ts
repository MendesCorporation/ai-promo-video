export interface CommandResult {
    stdout: string;
    stderr: string;
}
export declare function runCommand(command: string, args: string[], options?: {
    cwd?: string;
    quiet?: boolean;
}): Promise<CommandResult>;
