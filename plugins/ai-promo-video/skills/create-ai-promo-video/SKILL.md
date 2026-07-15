---
name: create-ai-promo-video
description: Directs, sources, records, composes, renders, edits, and visually reviews professional AI-authored promo videos with the local ai-promo-video MCP/CLI. Use for SaaS, product, brand, launch, feature, demo, emotional, or social videos that need real footage, licensed free stock video, images, SVGs, animations, designed motion, perspective, cursor choreography, licensed free music, and incremental revisions without a GUI, paid media, local model, or bundled AI model.
---

# Create AI Promo Video

Treat the work as motion direction and compositing, not as a screen recording or slide deck. The host model is the creative director and writes the unique scene source; local tools execute deterministic instructions.

## Composition Model

Every new production is authored directly as one Revideo TypeScript composition. Scaffold once, search the reusable motion vocabulary, combine only components that serve the specific story, and write custom nodes, timing, geometry, shaders, or Three.js in the same scene whenever the library is insufficient. Read [component-library.md](references/component-library.md) and [advanced-motion.md](references/advanced-motion.md).

Library-first does not mean template-first: never render a generic draft and replace its contents later. The neutral scaffold contains no visual design. Decide the art direction before choosing components, and do not inherit sample palettes, copy, card counts, layouts, music, or scene arcs from prior videos.

The version 1 JSON renderer is legacy compatibility only. Use it when the user supplies an existing v1 spec or explicitly requests maintenance of that format. Never use it to start a new production or as a disposable intermediate render. Read [video-spec.md](references/video-spec.md) only for that compatibility case.

## Workflow

1. Inspect the product, positioning, brand, and strongest proof. Define one audience, tension, promise, proof, and an appropriate CTA or resolution using [story-direction.md](references/story-direction.md).
2. Define a distinct art direction and timed beat plan. Choose story functions and shot scales for this brief instead of copying a fixed hero/product/cards/CTA sequence. Record the intended energy curve, camera logic, transition motive, and—when prior work or references are available—what makes this production visually different.
3. When real product proof is part of the story, create a private capture spec. Keep credentials in gitignored `*.local.json`. Capture screenshots or meaningful live flows as described in [capture-spec.md](references/capture-spec.md). Skip capture when the authorized brief is intentionally abstract, brand-led, or entirely based on supplied media.
4. When recording product interaction, prefer a clean source with the browser pointer hidden. Add a designed cursor, trace, click pulse, focus ring, or camera response only when the interaction needs it; none is mandatory decoration.
5. When outside media strengthens the story, search user-approved local folders, Openverse, Wikimedia Commons, and optional free-key Pexels for fitting free video and visual assets. Review previews and source pages, reject unsafe licenses, and download selections with their attribution manifests. Read [free-media-sourcing.md](references/free-media-sourcing.md).
6. Write musical intent in plain language before searching: emotion, energy curve, instrumentation to prefer or avoid, pacing, and edit accents. Search user-approved local folders and/or Openverse; bundled CC0 tracks remain available only when explicitly included. Compare at least three viable candidates when available, analyze the finalists, verify the license, and choose by fit rather than result order. No track is a default or fallback. Read [music-sourcing.md](references/music-sourcing.md).
7. Call `scaffold_advanced_video` once to create the neutral Revideo composition. Query `search_motion_components` for the shot's narrative needs, inspect selected entries with `get_motion_component`, and author the actual TypeScript timeline from those primitives plus custom code in the same files. Vary compositions, camera behavior, transitions, typography systems, particle seeds, and palettes according to the art direction. Do not create or render a template that will be replaced later.
8. Call `render_advanced_video`, probe the result, then call `create_visual_review_pack` with every planned scene boundary. Pass every returned overview and transition sheet to `read_visual_files`; inspect each image directly instead of inferring quality from a successful render or one contact sheet. Apply the quality gate in [motion-quality.md](references/motion-quality.md).
9. Record each material anomaly. Before revising existing work, call `list_advanced_video_files` and `read_advanced_video_file`, then patch exact source, render only the affected interval, and create a new visual review pack for that interval. Replace the exact range only after the revised pack passes. Read [revision-workflow.md](references/revision-workflow.md).
10. After the accepted final passes one last probe, call `clean_delivery_output` with the exact requested final filenames. Keep only those deliverables in the output directory. Preserve source, capture masters, downloaded media, license sidecars, attribution manifests, music licenses, and configuration outside the delivery output; never delete user-provided or irreplaceable inputs unless explicitly authorized.

## Direction Rules

- Lead with a relevant tension, desire, or changed outcome. When a claim depends on the product, prove it with a real product action or visible result.
- Vary shot scale according to meaning: the available range includes manifesto, full product, detail, live action, modular proof, and a CTA or resolution, but no production needs all of them.
- When the product appears, keep it legible and frame it as designed media; avoid long raw full-screen recordings.
- Use sourced footage and assets only when they strengthen the story; inspect the actual preview instead of selecting by title alone.
- Use true perspective or carefully composed 2.5D only when it adds hierarchy and depth.
- When using UI assembly, preserve believable parent/child relationships, purposeful stagger, and fidelity to the real product surface.
- Every cursor movement needs a destination; every click needs a UI or camera response.
- Prefer continuous visual motion across cuts: shared direction, color, scale, rhythm, or object continuity.
- Treat the component catalog as possibilities, not recommendations. Select by narrative need, customize the result, and avoid repeating the same component combination across unrelated productions.
- Do not default to centered headline, floating cards, purple/cyan gradients, orbit rings, a fixed six-scene arc, or any bundled music track. These remain valid only when independently justified by the current art direction.
- Measure separately animated words as a row with explicit optical gaps. Never guess independent x positions and assume the settled phrase will read as one unit.
- Treat temporary wide tracking as motion only. Verify the settled tracking, word spacing, logo lockup, and line breaks in extracted frames.
- Do not invent customer metrics or imply proof the product does not show.
- Voice is outside the current scope. Music is optional but must be licensed and credited when required.

## Tool Boundary

Use MCP when available and CLI for debugging or automation. The Skill supplies judgment; MCP supplies motion-component discovery, licensed-media search and download, music analysis, capture, recording, source reading and editing, Revideo rendering, media editing, range replacement, visual access, cleanup, and QA. Neither provides or selects an AI model. If the host does not discover filesystem Skills, invoke the MCP prompt `create-ai-promo-video`, read `ai-promo://director-guide`, or call `load_director_guide` before planning the production. Claude Desktop Home uses these MCP routes; Claude Code and the Claude app's Code tab also receive the same filesystem Skill under `~/.claude/skills`.

## Completion Gate

Do not deliver because rendering succeeded. Delivery requires a valid probe, license metadata for every sourced media file, a fresh `create_visual_review_pack`, and direct inspection of every generated sheet through `read_visual_files` or an equivalent native image view. Inspect settled typography, optical spacing, tracking, logo gaps, collisions, clipping, line breaks, camera continuity, transition frames, cursor causality, UI states, sourced-media quality, particles, audio discontinuities, and the final CTA or intentional resolution. If any material anomaly is found, patch it and regenerate the relevant review pack; delivery remains blocked until the revised images pass. After approval, probe the final once more, call `clean_delivery_output`, and verify the delivery directory contains only the requested deliverables.
