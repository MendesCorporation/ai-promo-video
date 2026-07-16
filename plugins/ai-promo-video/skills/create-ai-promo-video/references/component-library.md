# Motion Component Library

The library is a searchable vocabulary of visual systems, not a gallery of finished templates. It exists to give the host AI many reliable starting points without deciding the video's style.

## Discover

1. Write the shot's narrative job and art direction first.
2. Call `search_motion_components` with useful concepts, categories, moods, tags, or energy. Search multiple needs separately instead of one broad query.
3. Call `get_motion_component` for shortlisted entries. Read its compact parameters, source exports, and composition notes.
4. Before using an unfamiliar, fragile, or visually sensitive component, call `help` with the exact target such as `component:liquid-glass-text`. For a transition-category entry use `transition:<id>`. Exact help contains types, defaults, calibrated ranges where available, choreography, pitfalls, examples, and validation. Do not load every help entry.
5. Scaffold once. The same catalog is saved as `motion-library.json`; reusable code is in `motion-library.tsx`, `kinetic.ts`, `transitions.ts`, and `camera.ts`.
6. Import only the selected primitives. Restyle, combine, and extend them in the actual scene source.

The catalog covers format systems, safe areas, captions, backgrounds, layouts, typography, product presentation, shapes, transitions, camera, cursor behavior, particles, and effects. Typography includes both structural motion and temporary lighting such as the base-fill-preserving `SpecularTextStack` plus `specularTextSweep` pair. Search results are possibilities, not ranked creative recommendations. An empty or broad search is for exploration only.

`OpticalGlass` and `LiquidGlassText` are destination-texture optical primitives rather than visual presets. The former supplies a neutral rounded refractive surface; the latter turns a short, large, heavy word or logo into a live glyph lens. Their shader props alone are not the full material contract: call `help` for `component:optical-liquid-glass` or `component:liquid-glass-text` and follow its coupled backdrop, layer-order, parameter-envelope, continuous-motion, and validation requirements. Author palette, geometry, background, content, timing, and interaction for the current shot. Do not use optical type for paragraphs, captions, small copy, or thin fonts, and always inspect readability over both light and dark background regions.

The scaffold also includes `format.tsx`, `captions.tsx`, `ambient.ts`, `procedural.tsx`, `vector-motion.ts`, and `three-effects.ts`. These add adaptive aspect-ratio helpers, word-timed caption animation, full-shot ambient motion, seeded flow fields and attractors, font/SVG path motion, and optional Three.js finishing passes. None supplies a default scene or visual look.

`transitions.ts` contains executable, configurable rigs for every transition-category catalog entry: directional push, zoom through, shape wipe, object carry, directional blur cut, match scale, organic morph wipe, shared-element bridge, whip pan, and deterministic displacement reveal. `camera.ts` contains dedicated dolly, ambient camera, ambient parallax, orbit, focus tracking, parallax pan, perspective tilt, and an open `cameraPath` helper. These are reliable mechanisms, not mandatory designs. Change their geometry, paths, timing, easing, overlap, depth, and supporting layers, compose them with custom code, or ignore them and author a completely different effect.

## Compose

- Build a visual system from the current brand, audience, tension, product behavior, and emotional arc.
- Use custom TypeScript beside library components whenever one-off behavior would be stronger.
- Treat every source export as editable source, not a closed API. Copy and rewrite a rig when its internal choreography needs to change.
- Change deterministic particle seeds, paths, layout proportions, camera targets, palette, typography, and timing to fit the production.
- Prefer a few related components with a shared motion logic over many unrelated effects.
- Preserve visual continuity through direction, depth, objects, type, lighting, or musical accents.
- Use `runWithAmbientMotion` to keep selected background, camera, parallax, orbit, gradient, or light threads alive for the full shot while the main timeline advances. If narrative motion affects the same object, separate its pose and ambient transforms with nested rigs so threads never compete for one signal. Do not animate every layer or use ambient movement as a substitute for narrative motion.

## Originality check

Before rendering, compare the composition against recent work or any supplied examples. If it repeats the same centered headline, card assembly, purple/cyan field, orbit background, camera path, cursor tour, scene count, or musical choice without a story reason, revise the art direction. A component is reusable; a finished combination is not a default.

Do not render the blank scaffold or create a generic film to replace later. The first render should already be the authored production, even if it is a low-resolution timing pass.
