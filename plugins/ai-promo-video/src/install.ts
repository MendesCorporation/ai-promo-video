#!/usr/bin/env node
import { access, cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

type ClientName = 'codex' | 'claude-code' | 'cursor';

export interface InstallOptions {
  clients: ClientName[];
  runtimeDir?: string;
  homeDir?: string;
  dryRun: boolean;
  skipBrowser: boolean;
  help: boolean;
}

const serverName = 'ai-promo-video';
const skillName = 'create-ai-promo-video';

export function installUsage(): string {
  return `AI Promo Video universal installer

Usage:
  npx github:MendesCorporation/ai-promo-video install [options]

Options:
  --clients codex,claude-code,cursor  Clients to configure (default: all)
                                      "claude" remains a compatibility alias for "claude-code"
  --runtime-dir PATH            Stable runtime destination
  --skip-browser               Do not install Playwright Chromium
  --dry-run                    Print actions without changing the machine
  --help                       Show this help
`;
}

function optionValue(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

export function parseInstallArgs(args: string[]): InstallOptions {
  const options: InstallOptions = {
    clients: ['codex', 'claude-code', 'cursor'],
    dryRun: false,
    skipBrowser: false,
    help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === 'install') continue;
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--skip-browser') options.skipBrowser = true;
    else if (arg === '--runtime-dir') options.runtimeDir = optionValue(args, index++, arg);
    else if (arg === '--home') options.homeDir = optionValue(args, index++, arg);
    else if (arg === '--clients') {
      const requested = optionValue(args, index++, arg)
        .split(',')
        .map((value) => value.trim() === 'claude' ? 'claude-code' : value.trim())
        .filter(Boolean);
      const allowed = new Set<ClientName>(['codex', 'claude-code', 'cursor']);
      if (requested.length === 0 || requested.some((value) => !allowed.has(value as ClientName))) {
        throw new Error('--clients accepts codex, claude-code (or the claude alias), and/or cursor');
      }
      options.clients = [...new Set(requested as ClientName[])];
    } else throw new Error(`Unknown installer option: ${arg}`);
  }
  return options;
}

function defaultRuntimeDir(home: string): string {
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) return join(process.env.LOCALAPPDATA, 'ai-promo-video');
  return join(home, '.local', 'share', 'ai-promo-video');
}

function shellCommand(command: string, args: string[]): string {
  return [command, ...args].map((value) => /[\s"']/.test(value) ? JSON.stringify(value) : value).join(' ');
}

function commandExists(command: string): boolean {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return !result.error;
}

function run(command: string, args: string[], options: { cwd?: string; dryRun?: boolean; allowFailure?: boolean } = {}): void {
  console.log(`$ ${shellCommand(command, args)}`);
  if (options.dryRun) return;
  const result = spawnSync(command, args, { cwd: options.cwd, stdio: 'inherit' });
  if (result.error && !options.allowFailure) throw result.error;
  if (result.status !== 0 && !options.allowFailure) throw new Error(`Command failed with exit code ${result.status}: ${command}`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyRuntime(sourceRoot: string, runtimeDir: string, options: InstallOptions): Promise<void> {
  const staging = `${runtimeDir}.installing-${process.pid}`;
  if (options.dryRun) {
    console.log(`Install runtime: ${sourceRoot} -> ${runtimeDir}`);
    console.log(`Install production dependencies in ${runtimeDir}`);
    if (!options.skipBrowser) console.log('Install Playwright Chromium');
    return;
  }
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  for (const entry of ['dist', 'assets', 'skills', '.codex-plugin', '.mcp.json', 'package.json']) {
    const source = join(sourceRoot, entry);
    if (await exists(source)) await cp(source, join(staging, entry), { recursive: true });
  }
  const repositoryLicense = resolve(sourceRoot, '..', '..', 'LICENSE');
  if (await exists(repositoryLicense)) await cp(repositoryLicense, join(staging, 'LICENSE'));
  if (!await exists(join(staging, 'dist', 'mcp', 'server.js'))) {
    throw new Error('Built MCP server not found. Run npm run build before installing from a source checkout.');
  }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npm, ['install', '--omit=dev'], { cwd: staging });
  if (!options.skipBrowser) {
    const playwrightCli = join(staging, 'node_modules', 'playwright', 'cli.js');
    if (!await exists(playwrightCli)) throw new Error('Playwright is not installed in the runtime; remove --skip-dependencies or prepare the runtime first');
    run(process.execPath, [playwrightCli, 'install', 'chromium'], { cwd: staging });
  }
  await mkdir(dirname(runtimeDir), { recursive: true });
  await rm(runtimeDir, { recursive: true, force: true });
  await rename(staging, runtimeDir);
}

async function materializeSkill(source: string, destination: string, dryRun: boolean): Promise<void> {
  console.log(`Install Skill: ${destination}`);
  if (dryRun) return;
  await rm(destination, { recursive: true, force: true });
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
  if (!await exists(join(destination, 'SKILL.md'))) throw new Error(`Installed Skill is missing SKILL.md: ${destination}`);
}

async function mergeJsonMcp(path: string, entry: Record<string, unknown>, dryRun: boolean): Promise<void> {
  console.log(`Configure MCP: ${path}`);
  if (dryRun) return;
  let document: Record<string, unknown> = {};
  if (await exists(path)) document = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  const current = document.mcpServers;
  const mcpServers = current && typeof current === 'object' && !Array.isArray(current)
    ? current as Record<string, unknown>
    : {};
  document.mcpServers = { ...mcpServers, [serverName]: entry };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

function removeTomlSection(source: string, header: RegExp): string {
  const lines = source.split('\n');
  const kept: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (header.test(line.trim())) {
      skipping = true;
      continue;
    }
    if (skipping && /^\s*\[/.test(line)) skipping = false;
    if (!skipping) kept.push(line);
  }
  return kept.join('\n').trimEnd();
}

async function configureCodexFallback(configPath: string, nodePath: string, serverPath: string, dryRun: boolean): Promise<void> {
  console.log(`Configure MCP fallback: ${configPath}`);
  if (dryRun) return;
  const begin = '# BEGIN ai-promo-video installer';
  const end = '# END ai-promo-video installer';
  let source = await exists(configPath) ? await readFile(configPath, 'utf8') : '';
  source = source.replace(new RegExp(`\\n?${begin}[\\s\\S]*?${end}\\n?`, 'g'), '\n');
  source = removeTomlSection(source, /^\[mcp_servers\.(?:ai-promo-video|"ai-promo-video")\]$/);
  const block = `${begin}\n[mcp_servers.ai-promo-video]\ncommand = ${JSON.stringify(nodePath)}\nargs = [${JSON.stringify(serverPath)}]\n${end}`;
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${source.trimEnd()}${source.trim() ? '\n\n' : ''}${block}\n`, 'utf8');
}

async function configureClients(runtimeDir: string, home: string, options: InstallOptions): Promise<void> {
  const serverPath = join(runtimeDir, 'dist', 'mcp', 'server.js');
  const skillSource = join(runtimeDir, 'skills', skillName);
  for (const client of options.clients) {
    const skillRoot = client === 'codex' ? '.agents' : client === 'claude-code' ? '.claude' : '.cursor';
    const skillDestination = join(home, skillRoot, 'skills', skillName);
    await materializeSkill(skillSource, skillDestination, options.dryRun);
    if (client === 'codex') {
      if (!options.homeDir && commandExists('codex')) {
        run('codex', ['mcp', 'remove', serverName], { dryRun: options.dryRun, allowFailure: true });
        run('codex', ['mcp', 'add', serverName, '--', process.execPath, serverPath], { dryRun: options.dryRun });
      } else {
        await configureCodexFallback(join(home, '.codex', 'config.toml'), process.execPath, serverPath, options.dryRun);
      }
    } else if (client === 'claude-code') {
      if (!options.homeDir && commandExists('claude')) {
        run('claude', ['mcp', 'remove', '--scope', 'user', serverName], { dryRun: options.dryRun, allowFailure: true });
        run('claude', ['mcp', 'add', '--transport', 'stdio', '--scope', 'user', serverName, '--', process.execPath, serverPath], { dryRun: options.dryRun });
      } else {
        await mergeJsonMcp(join(home, '.claude.json'), {
          type: 'stdio', command: process.execPath, args: [serverPath], env: {},
        }, options.dryRun);
      }
      console.log(`Claude Code Skill command: /${skillName}`);
      console.log('Claude app Chat and claude.ai use separate cloud Skills and do not read ~/.claude/skills. Open a new Claude Code session to use this installation.');
    } else {
      await mergeJsonMcp(join(home, '.cursor', 'mcp.json'), {
        command: process.execPath, args: [serverPath], env: {},
      }, options.dryRun);
    }
  }
}

export async function installUniversal(options: InstallOptions): Promise<{ runtimeDir: string; clients: ClientName[] }> {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(major) || major < 20) throw new Error('Node.js 20 or newer is required');
  const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const home = resolve(options.homeDir ?? homedir());
  const runtimeDir = resolve(options.runtimeDir ?? defaultRuntimeDir(home));
  console.log(`AI Promo Video ${options.dryRun ? 'dry run' : 'installation'}`);
  await copyRuntime(sourceRoot, runtimeDir, options);
  await configureClients(runtimeDir, home, options);
  console.log(`\nInstalled runtime: ${runtimeDir}`);
  console.log(`Configured clients: ${options.clients.join(', ')}`);
  console.log('Start a new agent session, then ask it to create a professional AI promo video.');
  return { runtimeDir, clients: options.clients };
}

function isInstallerEntrypoint(invokedPath: string | undefined): boolean {
  if (!invokedPath) return false;
  try {
    return realpathSync(resolve(invokedPath)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isInstallerEntrypoint(process.argv[1])) {
  try {
    const options = parseInstallArgs(process.argv.slice(2));
    if (options.help) console.log(installUsage());
    else await installUniversal(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
