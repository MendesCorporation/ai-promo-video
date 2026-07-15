# Vertical Formats and Kinetic Captions

Use this reference when delivering portrait or square video, adapting landscape media, or animating speech captions.

## Format direction

Call `list_format_profiles` before scaffolding when the output platform matters. Pass `format` and `platform` to `scaffold_advanced_video`. The generated `format-profile.json` records dimensions, conservative safe-area insets, and authoring guidance; `format.tsx` supplies adaptive stages, safe-area bounds, focal crops, and portrait product surfaces.

Treat safe-area defaults as editable authoring guides. Platform controls and publishing UI can change. Check the current destination UI and adjust insets when necessary. Remove `SafeAreaOverlay` from the delivery render.

Do not scale a completed landscape composition into a portrait frame. Recompose it:

- Crop footage around a keyframed focal point.
- Show one legible product region per beat instead of a whole desktop surface.
- Stack or alternate b-roll, product proof, copy, and captions according to the current story emphasis.
- Shorten copy measures and increase settled reading time.
- Keep the dominant subject, CTA, and caption lane clear of platform controls.
- Review portrait output at actual phone-viewing scale as well as full resolution.

## Caption timing

`prepare_caption_timing` accepts SRT, WebVTT, cue JSON, or word-timing JSON. It writes normalized cue and word timing plus QA. Exact word input remains `word-exact`. SRT, VTT, or cue-only JSON receives deterministic, punctuation-weighted word interpolation and remains labeled `cue-interpolated`; never present it as exact alignment.

When only raw audio exists, use word timestamps from the host model if that host can analyze audio. This project does not bundle speech recognition, a local model, or a paid transcription service. Otherwise request SRT/VTT or a timed transcript.

Prefer one of the caption behaviors only when it matches the delivery:

- `playWordFollowCaption`: the current word lifts, scales, and changes color while the full phrase remains readable.
- `playKaraokeCaption`: current and completed words gain progressive emphasis.
- `playPunchCaption`: only words explicitly marked `emphasis` receive a stronger hit.
- Phrase replacement or push: split copy on semantic boundaries and calculate measured widths.
- Speaker captions: identify speakers only when the distinction is necessary.

Keep captions to short semantic groups. Avoid equal timing, random impact words, continuous bouncing, and a new style for every phrase. Retain enough contrast against every underlying frame; a background plate may appear only when the caption begins instead of sitting empty on screen.

## Caption review

Run `review_caption_timing` before animation and fix errors. Treat reading-speed, density, overlap, and fast-word warnings as directing inputs. After rendering, include caption entrances, active words, phrase replacements, and exits in the visual review pack. Inspect:

- Word highlighting against the audible phrase.
- Settled line breaks and optical gaps.
- Safe-area and product-hotspot collisions.
- Background contrast over moving footage.
- Plate timing so no empty caption container lingers.
- Enough stable time to read the phrase.

Keep the source SRT/VTT and normalized timing JSON outside the final-only output directory so incremental revisions do not require rebuilding timing.
