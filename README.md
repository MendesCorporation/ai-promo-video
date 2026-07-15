# AI Promo Video

**AI directs. MCP executes. Revideo and FFmpeg deliver the video.**

AI Promo Video is an open-source, headless production system for professional promo videos. There is no graphical editor, hosted service, local AI model, or hidden subscription. Users install the project, and the AI they already use in Codex, Claude Code, or Cursor gains the tools and instructions required to plan, capture, animate, render, review, and revise an entire video.

This is not a slideshow generator. The professional engine is built on Revideo and TypeScript, enabling fully custom motion design: perspective cameras, zoom and tracking, interfaces assembled element by element, choreographed cursors, kinetic typography, masks, filters, particles, SVG, procedural shapes, images, video, shaders, and Three.js scenes. FFmpeg handles editing, audio mixing, inspection, and incremental revisions.

## See what it can already do

The covers below link to the final MP4 files included in the repository.

### SignalNest — SaaS motion benchmark · 56 seconds

[![Watch the SignalNest motion benchmark](docs/media/signalnest-demo.jpg)](plugins/ai-promo-video/examples/motion-benchmark/output/signalnest-motion-benchmark-kinetic-v3-final-56s.mp4)

[Watch the MP4](plugins/ai-promo-video/examples/motion-benchmark/output/signalnest-motion-benchmark-kinetic-v3-final-56s.mp4)

A fully procedural composition created to test the visual language of a polished SaaS launch: per-word and per-letter motion, animated gradients, erase and rewrite effects, text pushing other text, typography-driven masks, particles, orbit systems, perspective UI, cards assembled in the scene, automation traces, and a final CTA. Music: “Synth/bass Short or Intro” by griffon_designs, CC0 1.0.

### QANode — product assembly and camera motion · 9.6 seconds

[![Watch the QANode demonstration](docs/media/qanode-demo.jpg)](plugins/ai-promo-video/examples/qanode/output/menu-assembly/qanode-menu-assembly-final.mp4)

[Watch the MP4](plugins/ai-promo-video/examples/qanode/output/menu-assembly/qanode-menu-assembly-final.mp4)

The interface begins empty. The camera locks onto the left navigation while each menu item is created, follows the click on **Scenarios**, shifts its focus, and reveals the list row by row. The product screen was reconstructed as an animatable composition instead of relying on a rigid transition to a screenshot.

### AINDA — emotional storytelling · 61 seconds

[![Watch the AINDA short film](docs/media/auto-superacao-demo.jpg)](plugins/ai-promo-video/examples/auto-superacao/output/AINDA-auto-superacao-final.mp4)

[Watch the MP4](plugins/ai-promo-video/examples/auto-superacao/output/AINDA-auto-superacao-final.mp4)

A test outside the SaaS category designed to prove narrative direction: freely licensed online footage, music-driven editing, pacing, atmosphere, image treatment, and emotional typography. Music: “Emotional Original Soundtrack — BETTER LIFE” by Magmi.Soundtracks, CC BY 4.0. Complete media credits remain with the project.

## Why this project exists

Recording an application is only raw material. A strong promo also needs a story, hierarchy, rhythm, camera movement, transitions, scene design, music, and dozens of small decisions that would normally be spread across screen-recording software, After Effects, and a video editor.

This project separates that problem into two parts:

- **The Skill is the director.** It teaches the AI how to turn a brief into a story, choose what to capture, design the shots, synchronize music, avoid generic motion, and review its own work.
- **The MCP server is the production crew.** It provides deterministic operations for navigating the product, recording it, finding free media, writing scenes, rendering, editing, extracting review frames, replacing only a damaged interval, and cleaning the delivery directory.

No AI model is bundled with the project. Codex, Claude, or Cursor uses the model already selected by the user. For clients that do not discover filesystem Skills, the MCP server exposes the same directing guide through a prompt and resources.

## From a request to a finished MP4

When a user asks for “a 30-second promo for this SaaS,” the AI follows this production cycle:

1. Understands the product, audience, promise, duration, format, and references.
2. Inspects the real application and decides which flows must be recorded.
3. Captures clean screenshots or product footage, including user-configured authenticated sessions.
4. Searches local or online sources for music, footage, and assets with known licenses.
5. Writes the story, scene map, musical beats, and camera intent.
6. Creates a custom Revideo/TypeScript scene without forcing the design into a fixed template.
7. Renders H.264/AAC video at 24–60 FPS and up to 4K.
8. Extracts frames from the full film and around every transition so the AI can inspect its own output.
9. Fixes visual anomalies, timing, typography, camera motion, or composition. If a problem is isolated, it rerenders and replaces only that interval.
10. Keeps only the editable project, credits, and approved MP4 in the delivery directory.

The AI gains autonomy without turning generation into a black box: the scene remains readable code, media retains attribution manifests, and every render can be reproduced.

## Installation

Requirements: Node.js 20 or newer on macOS, Linux, or Windows.

### Quick install

Install AI Promo Video for Codex, Claude Code, and Cursor with one command:

```bash
npx --yes github:MendesCorporation/ai-promo-video install
```

The installer downloads a stable local runtime, installs production dependencies and Playwright Chromium, installs the `create-ai-promo-video` Skill, and registers the `ai-promo-video` MCP server in all three clients. Existing unrelated Skills and MCP servers are preserved.

Restart the agent client after installation, then ask it to create a professional promo video.

Install for selected clients only or preview every planned change:

```bash
npx --yes github:MendesCorporation/ai-promo-video install --clients codex,cursor
npx --yes github:MendesCorporation/ai-promo-video install --dry-run
```

### Install from the repository

```bash
git clone https://github.com/MendesCorporation/ai-promo-video.git
cd ai-promo-video
npm run setup
node plugins/ai-promo-video/dist/install.js install
```

`setup` installs dependencies, installs the Chromium build used by Playwright, and compiles the project. The second command installs a stable runtime and configures Codex, Claude Code, and Cursor.

This route is intended for contributors and anyone who wants to inspect or modify the engine before installing it. To run directly from the checkout without installing it globally, use the CLI commands documented below.

### Install the Skill manually

The Skill is a regular folder and can be copied without running the universal installer. From a cloned repository, run only the line for your client:

```bash
# Codex — global user Skill
mkdir -p "$HOME/.agents/skills"
cp -R plugins/ai-promo-video/skills/create-ai-promo-video "$HOME/.agents/skills/"

# Claude Code — global user Skill
mkdir -p "$HOME/.claude/skills"
cp -R plugins/ai-promo-video/skills/create-ai-promo-video "$HOME/.claude/skills/"

# Cursor — global user Skill
mkdir -p "$HOME/.cursor/skills"
cp -R plugins/ai-promo-video/skills/create-ai-promo-video "$HOME/.cursor/skills/"
```

For a repository-scoped installation, copy the same folder into `.agents/skills/` for Codex, `.claude/skills/` for Claude Code, or `.cursor/skills/` for Cursor at the repository root.

These locations follow the current [Codex Skills](https://learn.chatgpt.com/docs/build-skills), [Claude Code Skills](https://code.claude.com/docs/en/skills), and [Cursor Agent Skills](https://cursor.com/docs/skills) documentation.

The Skill alone provides the directing workflow, production rules, and QA process. It does **not** provide the capture, search, render, editing, or visual-review tools. For complete video production, use the quick installer so the MCP server is installed as well.

After copying the Skill, restart the client if it does not appear automatically. Invoke it explicitly as `$create-ai-promo-video` in Codex, `/create-ai-promo-video` in Claude Code, or through Cursor's slash-command menu.

### What the installer configures

- Runtime under `~/.local/share/ai-promo-video` on macOS/Linux or the local application data directory on Windows.
- The `create-ai-promo-video` Skill under `~/.agents/skills`, `~/.claude/skills`, and `~/.cursor/skills`.
- The `ai-promo-video` stdio MCP server in Codex, Claude Code, and Cursor.
- Production dependencies and Playwright Chromium.

FFmpeg and FFprobe are supplied by npm dependencies and do not require a separate system installation.

The installation artifact contains only the runtime, Skill, required assets, and manifests. Demonstration videos and production media are not downloaded by the installer.

## How to request a video

After restarting the client, the initial request can be simple:

```text
Create a cinematic 30-second promo for the SaaS at http://localhost:3000.
The audience is QA leaders, and the core promise is reducing the time between
detecting and reproducing a defect. Use the product's visual identity, record
the real flow, find freely licensed music, and deliver at 1920x1080.
```

For more control, provide:

- Product URL and authentication instructions, without putting secrets in the prompt or Git.
- Audience, problem, promise, and CTA.
- Duration, aspect ratio, resolution, and FPS.
- References for pacing, camera movement, typography, and color.
- Authorized local directories containing music, footage, logos, and screenshots.
- Whether the AI may search online and which licenses are acceptable.

Revisions can also be requested in natural language:

```text
Between 7 and 11 seconds, the camera feels static. Lock the zoom onto the left
menu, follow the items as they assemble, and then slide the focus toward the
list. Preserve the rest of the video and inspect the transition frames before
delivering the revision.
```

The AI can read the existing source, edit only the affected scene or interval, render a patch, and replace that range in the final MP4.

## Capture, media, and motion capabilities

- Clean screenshots and recordings from local or remote applications.
- AI-controlled clicks, form filling, key presses, hover, selection, scrolling, navigation, and mouse movement.
- Recursive search across user-authorized local directories.
- Music search through Openverse, including download and attribution manifests.
- Footage search through Wikimedia Commons and, optionally, Pexels.
- Image and asset search through Openverse, Wikimedia Commons, and, optionally, Pexels.
- Openverse and Wikimedia require no API key. Pexels is free but requires `PEXELS_API_KEY`.
- Images, SVG, vector paths, masks, gradients, filters, shaders, particles, Three.js, and video clips inside the same composition.
- Kinetic typography by block, line, word, or character, including tracking, blur, rise, wipe, typewriter, erase/rewrite, swaps, and typography-driven masks.
- Non-destructive crop, resize, color treatment, blur/redaction, chroma removal, trim, speed, fades, volume, and mute.
- Frame-evaluated music envelopes for precise entrances, drops, pauses, ducks, and fades without rerendering the visuals.

Online results can only be selected when their license is known and allowed. Every download includes origin and attribution metadata.

## MCP tools

The server exposes 29 tools:

- Product: `inspect_saas`, `capture_saas`, `record_saas_flows`.
- Music: `list_music`, `generate_music_library`, `search_music`, `download_music`, `mix_music`.
- Free media: `search_free_videos`, `download_free_video`, `search_free_assets`, `download_free_asset`.
- Advanced motion: `list_motion_capabilities`, `scaffold_advanced_video`, `list_advanced_video_files`, `read_advanced_video_file`, `save_advanced_video_file`, `patch_advanced_video_file`, `render_advanced_video`.
- Editing: `edit_capture_image`, `edit_video`, `replace_video_range`.
- Fast JSON engine: `validate_video_plan`, `render_video`.
- Visual QA: `probe_video`, `extract_review_frames`, `create_visual_review_pack`, `read_visual_files`.
- Delivery: `clean_delivery_output`.

The `create-ai-promo-video` MCP prompt, the `ai-promo://director-guide` resource, and eight detailed reference resources make the complete workflow available even without native Skill discovery. Captures and review sheets are returned as MCP image content, allowing a vision-capable model to inspect the result.

## CLI usage

Everything available through MCP can also be invoked from the terminal:

```bash
# Inspect, capture, and record a product
node plugins/ai-promo-video/dist/cli.js inspect http://localhost:3000 --screenshot ./inspect.png
node plugins/ai-promo-video/dist/cli.js capture ./capture.local.json
node plugins/ai-promo-video/dist/cli.js record ./capture.local.json

# Search for free music and media
node plugins/ai-promo-video/dist/cli.js music:search "focused technology" --provider openverse
node plugins/ai-promo-video/dist/cli.js video:search --query "software team" --provider all --orientation landscape
node plugins/ai-promo-video/dist/cli.js asset:search --query "abstract technology" --provider all --kind image

# Create and render unrestricted motion
node plugins/ai-promo-video/dist/cli.js motion:capabilities
node plugins/ai-promo-video/dist/cli.js advanced:init ./advanced --name "Launch promo"
node plugins/ai-promo-video/dist/cli.js advanced:render ./advanced/project.tsx --output ./output/promo.mp4

# Render and replace only a revised interval
node plugins/ai-promo-video/dist/cli.js advanced:render ./advanced/project.tsx --output ./output/patch.mp4 --start 4.5 --end 10
node plugins/ai-promo-video/dist/cli.js video:replace-range ./replace.json

# Inspect and review the output visually
node plugins/ai-promo-video/dist/cli.js probe ./output/promo.mp4
node plugins/ai-promo-video/dist/cli.js review ./output/promo.mp4 --output-dir ./review --times 2,8,14,20,27,29
```

`image:edit` and `video:edit` accept JSON instructions. Credentials belong only in gitignored `*.local.json` files.

## Project structure

```text
plugins/ai-promo-video/
├── src/mcp/server.ts                 server and agent contract
├── src/install.ts                    universal installer
├── src/capture/                      product inspection and recording
├── src/advanced/                     editable Revideo projects
├── src/media/                        editing and incremental revisions
├── src/library/                      local and online free-media search
├── assets/revideo-template/          reusable motion primitives
└── skills/create-ai-promo-video/     direction, workflow, and QA criteria
```

The JSON engine remains available for deliberately simple or fast jobs. For campaign-level results and After Effects-like motion, the Skill directs the AI to use the advanced engine.

## Licensing and privacy

The project code is licensed under MIT. Revideo and Three.js are open source, Playwright controls the browser, and FFmpeg performs encoding and media editing. Dependencies retain their own licenses, including the packaged FFmpeg binary.

The project does not send the SaaS to its own model because it includes neither a model nor a hosted service. However, the user's selected agent may receive prompts, screenshots, or review frames according to that client's policies. Secrets, tokens, private URLs, and customer data must not be stored in scenes, manifests, or commits.

## Development and validation

```bash
npm run build
npm test
```

Rendering is deterministic for the same source, assets, versions, and platform. Revideo telemetry is disabled by the advanced renderer. Before delivery, the Skill requires duration and codec inspection, full-film sampling, transition review, and correction of visual anomalies.
