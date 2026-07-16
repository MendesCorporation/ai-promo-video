#!/usr/bin/env node
export type ClientName = 'codex' | 'claude-code' | 'claude-desktop' | 'cursor';
export interface InstallOptions {
    clients: ClientName[];
    runtimeDir?: string;
    homeDir?: string;
    dryRun: boolean;
    skipBrowser: boolean;
    help: boolean;
}
export declare const runtimeEntries: readonly ["dist", "assets", "scripts", "skills", ".codex-plugin", ".mcp.json", "package.json"];
export declare function installUsage(): string;
export declare function parseInstallArgs(args: string[]): InstallOptions;
export declare function defaultRuntimeDir(home: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): string;
export declare function clientSkillDestination(home: string, client: Exclude<ClientName, 'claude-desktop'>, platform?: NodeJS.Platform): string;
export declare function clientMcpConfigPath(home: string, client: Exclude<ClientName, 'claude-desktop'>, platform?: NodeJS.Platform): string;
export declare function defaultClaudeDesktopConfigPath(home: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): string;
export declare function windowsClaudeDesktopStoreConfigPath(localAppData: string, packageName: string): string;
export declare function parseWindowsWhereOutput(output: string): string[];
export declare function windowsCommandNeedsShell(command: string): boolean;
export declare function installUniversal(options: InstallOptions): Promise<{
    runtimeDir: string;
    clients: ClientName[];
}>;
