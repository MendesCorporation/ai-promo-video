#!/usr/bin/env node
import { runCommandByName } from './commands.js';

const help = `AI Promo Video — headless motion-design pipeline

Commands:
  inspect <url> [--screenshot path]
  capture <capture.json>
  record <capture.json>
  music [--mood word] [--max-intensity 0.7]
  music:search --query "focused technology" [--provider all|local|openverse] [--dirs path,path]
  music:download <openverse-id> --output-dir <dir>
  music:mix <mix.json>
  video:search --query "software team" [--provider all|local|wikimedia|pexels] [--dirs path,path] [--orientation landscape]
  video:download <id> --provider wikimedia|pexels --output-dir <dir>
  asset:search --query "abstract gradient" [--provider all|local|openverse|wikimedia|pexels] [--kind all|image|svg|animation]
  asset:download <id> --provider openverse|wikimedia|pexels --output-dir <dir>
  audio:generate
  validate <spec.json> [--kind video|capture]
  render <video.json> [--workers 4] [--keep-frames]
  motion:capabilities
  advanced:init <directory> --name "Product promo" [--width 1920 --height 1080 --fps 30]
  advanced:render <project.tsx> --output <video.mp4> [--workers 1] [--start 10 --end 16]
  advanced:patch <project-dir> <relative-file> <patches.json>
  image:edit <edit.json>
  video:edit <edit.json>
  video:replace-range <replace.json>
  probe <video.mp4>
  review <video.mp4> --output-dir <dir> --times 2,8,15
  review:auto <video.mp4> --output-dir <dir> [--interval 2 --transitions 4.5,8,13 --window 1 --fps 4]
`;

function parse(argv: string[]): { command?: string; args: string[]; flags: Record<string, string | boolean> } {
  const [command, ...rest] = argv;
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) {
      args.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = rest[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { command, args, flags };
}

async function main(): Promise<void> {
  const parsed = parse(process.argv.slice(2));
  if (!parsed.command || parsed.command === 'help' || parsed.command === '--help') {
    process.stdout.write(help);
    return;
  }
  const result = await runCommandByName(parsed.command, parsed.args, parsed.flags);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
