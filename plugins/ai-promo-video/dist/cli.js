#!/usr/bin/env node
import { runCommandByName } from './commands.js';
const help = `AI Promo Video — headless motion-design pipeline

Commands:
  inspect <url> [--screenshot path]
  capture <capture.json>
  record <capture.json>
  music [--mood word] [--max-intensity 0.7]
  music:search --query "focused technology" [--provider all|local|bundled|openverse] [--dirs path,path] [--include-bundled]
  music:download <openverse-id> --output-dir <dir>
  music:analyze <audio-file> [--review-dir <dir>]
  music:mix <mix.json>
  video:search --query "software team" [--provider all|local|wikimedia|pexels] [--dirs path,path] [--orientation landscape]
  video:download <id> --provider wikimedia|pexels --output-dir <dir>
  asset:search --query "abstract gradient" [--provider all|local|openverse|wikimedia|pexels] [--kind all|image|svg|animation]
  asset:download <id> --provider openverse|wikimedia|pexels --output-dir <dir>
  audio:generate
  validate <spec.json> [--kind video|capture]
  render <video.json> [--workers 4] [--keep-frames]
  motion:capabilities
  motion:search --query "camera follows interface assembly" [--categories camera,product --energy measured,impact]
  motion:get <component-id>
  format:list
  caption:prepare <captions.srt|vtt|json> [--output caption-timing.json]
  caption:review <caption-timing.json>
  advanced:init <directory> --name "Product promo" [--format landscape|portrait|square --platform generic|tiktok|instagram-reels|youtube-shorts --width 1920 --height 1080 --fps 30]
  advanced:render <project.tsx> --output <video.mp4> [--workers 1] [--start 10 --end 16] [--startup-timeout 120 --stall-timeout 300 --max-render-time 7200]
  advanced:patch <project-dir> <relative-file> <patches.json>
  image:edit <edit.json>
  video:edit <edit.json>
  video:replace-range <replace.json>
  probe <video.mp4>
  review <video.mp4> --output-dir <dir> --times 2,8,15
  review:auto <video.mp4> --output-dir <dir> [--interval 2 --transitions 4.5,8,13 --window 1 --fps 4]
`;
function parse(argv) {
    const [command, ...rest] = argv;
    const args = [];
    const flags = {};
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
        }
        else {
            flags[key] = true;
        }
    }
    return { command, args, flags };
}
async function main() {
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
//# sourceMappingURL=cli.js.map