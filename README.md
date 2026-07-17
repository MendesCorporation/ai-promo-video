# AI Promo Video

**AI directs. MCP executes. Revideo and FFmpeg deliver the video.**

AI Promo Video is an open-source, headless production system for professional promo videos. There is no graphical editor, hosted service, local AI model, or hidden subscription. Users install the project, and the AI they already use in Codex, Claude Code, or Cursor gains the tools and instructions required to plan, capture, animate, render, review, and revise an entire video.

This is not a slideshow generator. Every new production is one editable Revideo and TypeScript composition. The AI searches a broad vocabulary of reusable motion systems, combines only what fits the current story, and writes custom code in the same scene whenever needed. That enables perspective cameras, zoom and tracking, interfaces assembled element by element, choreographed cursors, kinetic typography, masks, filters, particles, SVG, procedural shapes, images, video, shaders, and Three.js scenes without locking the result to a template. FFmpeg handles editing, audio analysis and mixing, inspection, and incremental revisions.

## See what it can already do

The videos below play directly on GitHub. The full-resolution final MP4 files also remain versioned with their editable examples.

### SignalNest — SaaS motion benchmark · 56 seconds

https://github.com/user-attachments/assets/ca33b482-2330-46d2-a270-008b0d717a9a

A fully procedural composition created to test the visual language of a polished SaaS launch: per-word and per-letter motion, animated gradients, erase and rewrite effects, text pushing other text, typography-driven masks, particles, orbit systems, perspective UI, cards assembled in the scene, automation traces, and a final CTA. Music: “Synth/bass Short or Intro” by griffon_designs, CC0 1.0.

### QANode — product assembly and camera motion · 9.6 seconds

https://github.com/user-attachments/assets/09ed9971-f1de-4b95-8300-4b29ab71a49c

The interface begins empty. The camera locks onto the left navigation while each menu item is created, follows the click on **Scenarios**, shifts its focus, and reveals the list row by row. The product screen was reconstructed as an animatable composition instead of relying on a rigid transition to a screenshot.

### AINDA — emotional storytelling · 61 seconds

https://github.com/user-attachments/assets/93ade655-8b51-44e9-9218-bf3950bd7ab7

A test outside the SaaS category designed to prove narrative direction: freely licensed online footage, music-driven editing, pacing, atmosphere, image treatment, and emotional typography. Music: “Emotional Original Soundtrack — BETTER LIFE” by Magmi.Soundtracks, CC BY 4.0. Complete media credits remain with the project.

## Why this project exists

Recording an application is only raw material. A strong promo also needs a story, hierarchy, rhythm, camera movement, transitions, scene design, music, and dozens of small decisions that would normally be spread across screen-recording software, After Effects, and a video editor.

This project separates that problem into two parts:

- **The Skill is the director.** It teaches the AI how to turn a brief into a distinct story and art direction, choose what to capture, discover motion components without treating them as templates, compare music without a default track, and review its own work.
- **The MCP server is the production crew.** It provides progressive contextual help plus deterministic operations for navigating the product, recording it, searching the motion library and free media, analyzing music, writing scenes, rendering, editing, extracting review frames, replacing only a damaged interval, and cleaning disposable artifacts across the finished production.

No AI model is bundled with the project. Codex, Claude, or Cursor uses the model already selected by the user. For clients that do not discover filesystem Skills, the MCP server exposes the same directing guide through a prompt and resources.

## From a request to a finished MP4

When a user asks for “a 30-second promo for this SaaS,” the AI follows this production cycle:

1. Understands the product, audience, promise, duration, format, and references.
2. Inspects the real application and decides which flows must be recorded.
3. Captures clean screenshots or product footage, including user-configured authenticated sessions.
4. Writes the musical intent, then searches local or online sources for music, footage, and assets with known licenses. Bundled tracks are optional and excluded unless explicitly requested.
5. Writes a story, art direction, beat map, musical accents, and camera logic for this production rather than copying a fixed scene arc.
6. Searches the component vocabulary, loads detailed help only for the selected tools/components/transitions, and creates the real Revideo/TypeScript composition from those primitives plus custom code. It never renders a generic template to replace later.
7. Renders H.264/AAC video at 24–60 FPS and up to 4K.
8. Extracts frames from the full film and around every transition so the AI can inspect its own output.
9. Fixes visual anomalies, timing, typography, camera motion, or composition. If a problem is isolated, it rerenders and replaces only that interval.
10. Keeps only the editable project, required render inputs, credits, and approved deliverables; generated reviews, previews, caches, and intermediate renders are removed across the production.

The AI gains autonomy without turning generation into a black box: the scene remains readable code, media retains attribution manifests, and every render can be reproduced.

## Installation

Requirements: Node.js 20 or newer on macOS, Linux, or Windows.

### Quick install

Install AI Promo Video for Codex, Claude Code, Claude Desktop, and Cursor with one command:

```bash
npx --yes @apptrix/ai-promo-video install
```

The installer downloads a stable local runtime, installs production dependencies and Playwright Chromium, installs the `create-ai-promo-video` Skill, and registers the `ai-promo-video` MCP server in all four clients. Existing unrelated Skills and MCP servers are preserved.

Claude has two local surfaces with different extension mechanisms:

- Claude Code, including the Claude app's **Code** tab, receives the filesystem Skill from `~/.claude/skills` and the user-scoped MCP server. Verify it with `/create-ai-promo-video` and `claude mcp get ai-promo-video`.
- Claude Desktop's **Home** chat does not read filesystem Skills. It receives the same director guide through the local MCP server as server instructions, the `create-ai-promo-video` prompt, the `ai-promo://director-guide` resource, and the `load_director_guide` tool for clients that expose tools only. Fully quit and reopen Claude Desktop after installation.

Regular claude.ai web conversations still use separately uploaded cloud Skills and do not read local files or local MCP configuration.

Restart the agent client after installation, then ask it to create a professional promo video.

Install for selected clients only or preview every planned change:

```bash
npx --yes @apptrix/ai-promo-video install --clients codex,cursor
npx --yes @apptrix/ai-promo-video install --clients claude
npx --yes @apptrix/ai-promo-video install --clients claude-code
npx --yes @apptrix/ai-promo-video install --clients claude-desktop
npx --yes @apptrix/ai-promo-video install --dry-run
```

The `claude` alias configures both Claude Code and Claude Desktop.

#### Windows and WSL

From native Windows PowerShell, use `npx.cmd` to avoid PowerShell execution-policy conflicts with `npx.ps1`:

```powershell
npx.cmd --yes @apptrix/ai-promo-video install
```

Run the installer in the same environment as the agent client. Native Windows clients use `%USERPROFILE%` and `%LOCALAPPDATA%`; an installer launched inside WSL uses the Linux home directory and configures clients running inside WSL. A WSL installation does not configure native Windows Codex, Claude, or Cursor, and a native installation does not configure their WSL instances.

### Install from the repository

```bash
git clone https://github.com/MendesCorporation/ai-promo-video.git
cd ai-promo-video
npm run setup
node plugins/ai-promo-video/dist/install.js install
```

`setup` installs dependencies, applies the pinned and idempotent Revideo 0.11 shader-context compatibility patch, installs the Chromium build used by Playwright, and compiles the project. The second command installs a stable runtime and configures Codex, Claude Code, and Cursor.

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

On native Windows PowerShell, the following copies the Skill to all three user-level discovery locations:

```powershell
$source = (Resolve-Path "plugins\ai-promo-video\skills\create-ai-promo-video").Path
$destinations = @(
  (Join-Path $HOME ".agents\skills\create-ai-promo-video"),
  (Join-Path $HOME ".claude\skills\create-ai-promo-video"),
  (Join-Path $HOME ".cursor\skills\create-ai-promo-video")
)
foreach ($destination in $destinations) {
  New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
  Remove-Item $destination -Recurse -Force -ErrorAction SilentlyContinue
  Copy-Item $source $destination -Recurse -Force
}
```

These locations follow the current [Codex Skills](https://learn.chatgpt.com/docs/build-skills), [Claude Code Skills](https://code.claude.com/docs/en/skills), and [Cursor Agent Skills](https://cursor.com/docs/skills) documentation.

The Skill alone provides the directing workflow, production rules, and QA process. It does **not** provide the capture, search, render, editing, or visual-review tools. For complete video production, use the quick installer so the MCP server is installed as well.

After copying the Skill, restart the client if it does not appear automatically. Invoke it explicitly as `$create-ai-promo-video` in Codex, `/create-ai-promo-video` in Claude Code or the Claude app's Code tab, or through Cursor's slash-command menu. Claude Desktop Home requires the MCP installation because it does not scan this folder.

### What the installer configures

- Runtime under `~/.local/share/ai-promo-video` on macOS/Linux or `%LOCALAPPDATA%\ai-promo-video` on Windows.
- The `create-ai-promo-video` Skill under `~/.agents/skills`, `~/.claude/skills`, and `~/.cursor/skills`.
- The `ai-promo-video` stdio MCP server in Codex, Claude Code, Claude Desktop, and Cursor.
- Production dependencies and Playwright Chromium.

On Windows, the user MCP files resolve under `%USERPROFILE%\.codex\config.toml`, `%USERPROFILE%\.claude.json`, and `%USERPROFILE%\.cursor\mcp.json`. Claude Desktop uses `%APPDATA%\Claude\claude_desktop_config.json`; Microsoft Store builds are detected under the matching `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude` directory.

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
- Music search through local folders and Openverse, including download and attribution manifests, without a default or fallback track.
- Music comparison through loudness, energy-curve, peak, silence, waveform, and spectrogram analysis.
- Footage search through Wikimedia Commons and, optionally, Pexels.
- Image and asset search through Openverse, Wikimedia Commons, and, optionally, Pexels.
- Openverse and Wikimedia require no API key. Pexels is free but requires `PEXELS_API_KEY`.
- Images, SVG, vector paths, masks, native Revideo linear/radial gradients, filters, shaders, particles, Three.js, and video clips inside the same composition. The scaffold includes `paint.ts` helpers for native coordinates and CSS-angle conversion; preflight rejects unsupported CSS `linear-gradient(...)`/`radial-gradient(...)` paint strings with contextual help before Chromium starts.
- Native landscape, portrait, and square composition profiles with adaptive stages, focal product crops, and editable safe-area defaults for TikTok, Instagram Reels, and YouTube Shorts. Vertical output is recomposed rather than produced by shrinking a landscape scene.
- A searchable motion vocabulary spanning backgrounds, formats, layouts, captions, typography, product presentation, shapes, transitions, camera, cursors, particles, and effects; every item can be restyled, combined, or replaced with custom TypeScript.
- Ten executable transition rigs and seven executable camera rigs live in `transitions.ts` and `camera.ts`, with typed controls for vectors, overlap, blur, depth, curves, targets, bounds, perspective, deterministic seeds, and timing. They are editable starting points—not templates or constraints—and the AI may ignore them, rewrite them, combine them, or author an entirely original Revideo, SVG, GLSL, or Three.js system.
- Kinetic typography by block, line, word, or character, including tracking, blur, rise, wipe, typewriter, erase/rewrite, swaps, and typography-driven masks.
- Reusable destination-texture optical glass for authored surfaces plus liquid-glass glyph lenses with refraction, dispersion, responsive highlights, and luminance-aware text contrast.
- Speech-following captions from SRT, WebVTT, cue JSON, or exact word-timing JSON, with word-follow, karaoke, punch, phrase-window, speaker, and adaptive caption-lane systems. Cue-only timestamps are labeled as approximate interpolation instead of being presented as exact alignment.
- Vector glyph outlines and SVG path morphing through OpenType.js and Flubber; seeded flow fields, attraction, dissolution, and shockwaves through Simplex Noise; optional selective bloom, depth of field, chromatic aberration, grain, and vignette through Three.js postprocessing.
- Non-destructive crop, resize, color treatment, blur/redaction, chroma removal, trim, speed, fades, volume, and mute.
- Frame-evaluated music envelopes for precise entrances, drops, pauses, ducks, and fades without rerendering the visuals.

Online results can only be selected when their license is known and allowed. Every download includes origin and attribution metadata.

## MCP tools

The server exposes 37 tools:

- Progressive documentation: `help`. Call it without arguments for a compact index, with `query` for short candidates, or with an exact target such as `component:liquid-glass-text`, `transition:camera-zoom-through`, or `tool:render_advanced_video` for parameter types, runtime defaults, calibrated ranges where available, choreography, examples, pitfalls, source signatures, and validation rules.
- Product: `inspect_saas`, `capture_saas`, `record_saas_flows`.
- Music: `list_music`, `generate_music_library`, `search_music`, `download_music`, `analyze_music`, `mix_music`.
- Free media: `search_free_videos`, `download_free_video`, `search_free_assets`, `download_free_asset`.
- Formats and captions: `list_format_profiles`, `prepare_caption_timing`, `review_caption_timing`.
- Motion composition: `list_motion_capabilities`, `search_motion_components`, `get_motion_component`, `scaffold_advanced_video`, `list_advanced_video_files`, `read_advanced_video_file`, `save_advanced_video_file`, `patch_advanced_video_file`, `render_advanced_video`.
- Editing: `edit_capture_image`, `edit_video`, `replace_video_range`.
- Legacy JSON compatibility: `validate_video_plan`, `render_video`.
- Visual QA: `probe_video`, `extract_review_frames`, `create_visual_review_pack`, `read_visual_files`.
- Delivery: `clean_delivery_output`.

The contextual `help` tool keeps routine calls small: the full catalog is never injected automatically, and exact documentation is returned only for the requested target. The `create-ai-promo-video` MCP prompt, the `ai-promo://director-guide` and `ai-promo://motion-library` resources, and ten detailed reference resources make the complete workflow available even without native Skill discovery. Captures and review sheets are returned as MCP image content, allowing a vision-capable model to inspect the result. Advanced renders publish live phase and percentage updates through MCP progress and logging notifications. Each render runs in an isolated process group, so cancellation, startup failure, stalls, and timeouts clean up its Chromium and Vite processes automatically.

## CLI usage

Everything available through MCP can also be invoked from the terminal:

```bash
# Inspect, capture, and record a product
node plugins/ai-promo-video/dist/cli.js inspect http://localhost:3000 --screenshot ./inspect.png
node plugins/ai-promo-video/dist/cli.js capture ./capture.local.json
node plugins/ai-promo-video/dist/cli.js record ./capture.local.json

# Search for free music and media
node plugins/ai-promo-video/dist/cli.js music:search "focused technology" --provider openverse
node plugins/ai-promo-video/dist/cli.js music:analyze ./music/candidate.mp3 --review-dir ./music-review
node plugins/ai-promo-video/dist/cli.js video:search --query "software team" --provider all --orientation landscape
node plugins/ai-promo-video/dist/cli.js asset:search --query "abstract technology" --provider all --kind image

# Create and render unrestricted motion
node plugins/ai-promo-video/dist/cli.js motion:capabilities
node plugins/ai-promo-video/dist/cli.js motion:search --query "camera follows interface assembly" --categories camera,product
node plugins/ai-promo-video/dist/cli.js format:list
node plugins/ai-promo-video/dist/cli.js advanced:init ./advanced --name "Launch promo" --format portrait --platform tiktok
node plugins/ai-promo-video/dist/cli.js advanced:render ./advanced/project.tsx --output ./output/promo.mp4

# Prepare captions that follow speech and review their timing
node plugins/ai-promo-video/dist/cli.js caption:prepare ./captions.srt --output ./advanced/caption-timing.json
node plugins/ai-promo-video/dist/cli.js caption:review ./advanced/caption-timing.json

# Render and replace only a revised interval
node plugins/ai-promo-video/dist/cli.js advanced:render ./advanced/project.tsx --output ./output/patch.mp4 --start 4.5 --end 10
node plugins/ai-promo-video/dist/cli.js video:replace-range ./replace.json

# Inspect and review the output visually
node plugins/ai-promo-video/dist/cli.js probe ./output/promo.mp4
node plugins/ai-promo-video/dist/cli.js review ./output/promo.mp4 --output-dir ./review --times 2,8,14,20,27,29

# Keep accepted finals and remove disposable artifacts across this production
node plugins/ai-promo-video/dist/cli.js clean ./delivery --keep promo.mp4,credits.json --project-dir . --temporary-paths official-promo-frames,custom-audit
```

`image:edit` and `video:edit` accept JSON instructions. Credentials belong only in gitignored `*.local.json` files.

## Project structure

```text
plugins/ai-promo-video/
├── src/mcp/server.ts                 server and agent contract
├── src/install.ts                    universal installer
├── src/capture/                      product inspection and recording
├── src/advanced/                     motion catalog and editable Revideo projects
├── src/captions/                     caption import, word timing, and timing QA
├── src/media/                        editing and incremental revisions
├── src/library/                      local and online free-media search
├── assets/revideo-template/          neutral scaffold and reusable motion primitives
└── skills/create-ai-promo-video/     direction, workflow, and QA criteria
```

The JSON engine remains only for existing version 1 compatibility. New productions start directly as neutral Revideo compositions, whether they use mostly library primitives or extensive custom code.

## Licensing and privacy

The project code is licensed under MIT. Revideo and Three.js are open source, Playwright controls the browser, and FFmpeg performs encoding and media editing. Dependencies retain their own licenses, including the packaged FFmpeg binary.

The project does not send the SaaS to its own model because it includes neither a model nor a hosted service. However, the user's selected agent may receive prompts, screenshots, or review frames according to that client's policies. Secrets, tokens, private URLs, and customer data must not be stored in scenes, manifests, or commits.

## Development and validation

```bash
npm run build
npm test
npm run test:revideo-shader
```

The shader regression test renders source and destination-texture shaders with reactive parameters across two workers. `npm run revideo:patch:check` verifies the local Revideo compatibility patch without changing files. The install fails safely if Revideo's pinned version or expected runtime shape changes, instead of modifying an unknown build.

Rendering is deterministic for the same source, assets, versions, and platform. Revideo telemetry is disabled by the advanced renderer. The CLI prints live render progress to stderr while preserving the machine-readable result on stdout. Before delivery, the Skill requires duration and codec inspection, full-film sampling, transition review, and correction of visual anomalies.
