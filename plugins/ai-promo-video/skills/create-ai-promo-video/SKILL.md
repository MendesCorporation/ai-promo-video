---
name: create-ai-promo-video
description: Direct, source, record, compose, render, edit, and visually review professional AI-authored promo videos with the local ai-promo-video MCP/CLI. Use for SaaS, product, brand, launch, feature, demo, emotional, or social videos that need real footage, licensed free stock video, images, SVGs, animations, designed motion, perspective, cursor choreography, licensed free music, and incremental revisions without a GUI, paid media, local model, or bundled AI model.
---

# Create AI Promo Video

Treat the work as motion direction and compositing, not as a screen recording or slide deck. The host model is the creative director and writes the unique scene source; local tools execute deterministic instructions.

## Choose the Engine

Use advanced Revideo TypeScript for any request described as professional, cinematic, unique, After Effects-like, or reference-quality. Read [advanced-motion.md](references/advanced-motion.md).

Use the version 1 JSON renderer only for a fast, constrained, intentionally template-like result. Read [video-spec.md](references/video-spec.md).

## Workflow

1. Inspect the product, positioning, brand, and strongest proof. Define one audience, tension, promise, proof, and CTA using [story-direction.md](references/story-direction.md).
2. Write a timed shot plan. For 30 seconds, use roughly 5–7 scenes with visual continuity and a deliberate energy curve.
3. Create a private capture spec. Keep credentials in gitignored `*.local.json`. Capture screenshots and record meaningful live flows as described in [capture-spec.md](references/capture-spec.md).
4. Prefer clean product recording with the browser pointer hidden. Build a designed cursor, trace, click pulse, focus ring, and camera response in the motion scene.
5. Search user-approved local folders, Openverse, Wikimedia Commons, and optional free-key Pexels for fitting free video and visual assets. Review previews and source pages, reject unsafe licenses, and download selections with their attribution manifests. Read [free-media-sourcing.md](references/free-media-sourcing.md).
6. Search local folders and/or Openverse for fitting music. Check the license, download it with its attribution manifest, and mix it as support rather than as the subject. Read [music-sourcing.md](references/music-sourcing.md).
7. Scaffold an advanced project. Author TypeScript components, shapes, media layers, timing, and any Three.js or shader work needed for this specific story. Do not force the story into a fixed template.
8. Render and probe, then call `create_visual_review_pack` with every planned scene boundary. Pass every returned overview and transition sheet to `read_visual_files`; inspect each image directly instead of inferring quality from a successful render or one contact sheet. Apply the quality gate in [motion-quality.md](references/motion-quality.md).
9. Record each material anomaly. Before revising existing work, call `list_advanced_video_files` and `read_advanced_video_file`, then patch exact source, render only the affected interval, and create a new visual review pack for that interval. Replace the exact range only after the revised pack passes. Read [revision-workflow.md](references/revision-workflow.md).
10. After the accepted final passes one last probe, call `clean_delivery_output` with the exact requested final filenames. Keep only those deliverables in the output directory. Preserve source, capture masters, downloaded media, license sidecars, attribution manifests, music licenses, and configuration outside the delivery output; never delete user-provided or irreplaceable inputs unless explicitly authorized.

## Direction Rules

- Lead with a customer tension or changed outcome, then prove it with the product.
- Alternate scale: manifesto, full product, detail, live action, modular proof, CTA.
- Keep the product legible and framed as designed media; avoid long raw full-screen recordings.
- Use sourced footage and assets only when they strengthen the story; inspect the actual preview instead of selecting by title alone.
- Use true perspective or carefully composed 2.5D only when it adds hierarchy and depth.
- Animate UI assembly with believable parent/child relationships and stagger; resolve it into a real product surface.
- Every cursor movement needs a destination; every click needs a UI or camera response.
- Prefer continuous visual motion across cuts: shared direction, color, scale, rhythm, or object continuity.
- Measure separately animated words as a row with explicit optical gaps. Never guess independent x positions and assume the settled phrase will read as one unit.
- Treat temporary wide tracking as motion only. Verify the settled tracking, word spacing, logo lockup, and line breaks in extracted frames.
- Do not invent customer metrics or imply proof the product does not show.
- Voice is outside the current scope. Music is optional but must be licensed and credited when required.

## Tool Boundary

Use MCP when available and CLI for debugging or automation. The Skill supplies judgment; MCP supplies licensed-media search and download, capture, recording, source reading and editing, rendering, media editing, range replacement, visual access, cleanup, and QA. Neither provides or selects an AI model. If the host does not discover filesystem Skills, invoke the MCP prompt `create-ai-promo-video` or read `ai-promo://director-guide` before planning the production.

## Completion Gate

Do not deliver because rendering succeeded. Delivery requires a valid probe, license metadata for every sourced media file, a fresh `create_visual_review_pack`, and direct inspection of every generated sheet through `read_visual_files` or an equivalent native image view. Inspect settled typography, optical spacing, tracking, logo gaps, collisions, clipping, line breaks, camera continuity, transition frames, cursor causality, UI states, sourced-media quality, particles, audio discontinuities, and the final CTA. If any material anomaly is found, patch it and regenerate the relevant review pack; delivery remains blocked until the revised images pass. After approval, probe the final once more, call `clean_delivery_output`, and verify the delivery directory contains only the requested deliverables.
