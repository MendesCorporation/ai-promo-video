# Revideo Composition Direction

Revideo TypeScript is the production engine for every new video. Use `list_motion_capabilities`, search the component vocabulary, scaffold one neutral project, author or patch its source, and render it headlessly. For a short promo, keep one master engine scene and express narrative shots as modular generators/groups inside it; persistent layers and overlapping transitions can then cross logical boundaries without turning the source into one undifferentiated block. Assets placed in the project or parent `public` folder are available to browser media nodes.

The scaffold is intentionally blank and minimal. It creates only `project.tsx`, `scene.tsx`, `review.tsx`, `format-profile.json`, and `motion-plan.json`, not a sample film or a local copy of the complete helper library. Search the catalog, then call `add_advanced_video_helpers` with the smallest set selected for the actual shots. It copies required dependencies but never overwrites an authored file. Select, combine, restyle, or rewrite those sources inside the real production. Every helper is optional and editable; custom TypeScript, Three.js, shaders, SVG geometry, and one-off timing live beside library components in the same scene. There is no separate “template mode” and “advanced mode,” and the catalog never limits what the AI may author.

The patterns below are implementation references to consult only after the shot plan calls for them. They are not a checklist, house style, or default set of scenes. An emotional film, brand piece, kinetic manifesto, footage-led edit, or other production may need none of the product-screen patterns.

## Product-screen patterns

### Perspective reveal

Place a screenshot or recording in a clipped, rounded frame. Animate scale, rotation, skew/perspective, position, shadow, and background parallax together. For a hero-quality 3D camera move, map the product texture to Three.js geometry and animate a perspective camera instead of stacking unrelated 2D transforms.

### UI assembly

Start with the real hierarchy needed for the shot: this may be an outer frame followed by navigation, content, rows, controls, or data with coordinated stagger. Preserve believable containment and match the actual product. An authored reconstruction may remain on screen when it is faithful and more controllable; transition to a screenshot or recording only when that improves proof and continuity, never as a mandatory final step.

### Cursor and click

Use an SVG path or vector cursor above the clean recording. Animate it along a deliberate route with eased arrival. On click, briefly scale it down, emit a ring, change the target, and add a subtle camera response. Never drift a cursor for decoration.

### Abstract depth

Use blurred light fields, orbital geometry, procedural shapes, particles, paths, gradients, or shader surfaces to create an environment. Connect the environment to the brand palette and product movement. Avoid generic floating blobs with no interaction.

### Cards and typography

Cards should arrive with hierarchy: container, number/icon, title, supporting copy. Vary rotation and depth while keeping the settle readable. Typography can reveal by line, word, mask, or path, but retain enough stable screen time for comprehension.

When selected through `add_advanced_video_helpers`, `kinetic.ts` supplies reusable tracking reveal, word cascade, impact, per-letter rise, animated gradient, specular text light sweep, typewriter, erase/rewrite, phrase swap, text-push, and measured-row primitives. `motion-library.tsx` adds backgrounds, product frames, camera helpers, cursor feedback, particles, routes, focus systems, and composable surfaces. `vector-motion.ts` converts licensed fonts into glyph paths, draws contours, morphs SVG paths, and samples text-on-path poses. `procedural.tsx` supplies deterministic simplex-noise flow fields, particle attraction/dissolution, and shockwaves. `three-effects.ts` supplies an opt-in finishing stack for true Three.js scenes. Treat all of them as a vocabulary, not a mandatory look. Link type scale, tracking, blur, direction, lighting, and exit motion to the camera move or transition that follows so text behaves as a scene object instead of a generic overlay. Use measured rows when words are separate nodes; temporary tracking may be expressive, but the settled phrase must pass optical-spacing review. Build specular text with `SpecularTextStack` at scene setup and call `specularTextSweep` only after the base text has settled. Prebuilding the hidden overlays prevents dynamic font relayout; the pass preserves the base fill and returns both light layers to transparent.

The optional `optical-glass` and `liquid-glass-text` helper groups each add their TypeScript source and paired GLSL shader. Both use destination-texture GLSL and therefore depend on `experimentalFeatures: true`, which the neutral project enables. Animate their reactive optical parameters inside the authored timeline. A moving or structured background is necessary to make refraction visible; the example palette, dimensions, copy, and morph sequence are never defaults.

## Transition and camera rigs

Import executable transition rigs from `transitions.ts` only after designing the outgoing pose, transition cause, and incoming pose. The file provides directional push, zoom through, authored-shape wipe, curved object carry, true animated blur cut, measured match scale, SVG morph wipe, shared-element z-arc, whip pan with settle, and deterministic strip displacement. Author the actual shapes, shared objects, clones, bounds, strip geometry, vectors, and timing for the current cut. Dense transition-strip review remains mandatory.

Import camera rigs from `camera.ts` for curved dolly, continuous ambient camera, ambient depth parallax, 2.5D orbit, sequential focus tracking, parallax pan, animated perspective tilt, velocity-preserving `continuousCameraPath`, or explicitly segmented `cameraPath`. Use the continuous helper when one move crosses multiple narrative beats; its Hermite timeline preserves velocity through intermediate keyframes. Use segmented paths only when full arrivals are intentional. These helpers operate on caller-authored world and layer rigs. For physically correct rotation, depth of field, and perspective, build a Three.js scene instead of forcing a 2.5D helper. The AI may always rewrite or bypass the supplied rigs.

Search by the current shot's need, such as “camera follows assembling navigation,” “quiet emotional depth,” or “type becomes a transition mask.” Combine only a small coherent subset. If the exact behavior is absent, author it directly instead of approximating the story with a near-matching component.

## Media

`Img`, `Video`, `Audio`, `SVG`, vector `Path`, and procedural nodes may share a scene. Use the web video decoder for local MP4 assets. Edit derived captures before composition when crop, color, redaction, chroma removal, timing, speed, or fades improve the source; keep originals intact.

## Timing

Write explicit scene boundary comments and keep the source timeline stable. This makes interval-only rendering and final MP4 replacement safe. Use shared palette, direction, scale, object, or rhythm to carry energy through cuts.

Complete the scaffold's `motion-plan.json` before authoring. It is the machine-readable direction contract for shot boundaries, focal regions, layer motion, camera path, velocity bridges, exact settle/transition review moments, and intentional stillness. For every non-final shot, `boundaryToNext.mode` is `continuous`, `motivated-cut`, or `intentional-stop`; describe the `carrier` for the first two and the boundary `intent` for all three. Then call `validate_motion_plan` before rendering. This lets the Review Pack measure the intended subject instead of mistaking ambient pixel movement for continuity or rejecting the plan only after an expensive render.

For a shot that should feel alive, author the story beats as one generator and pass it with selected `ambientDrift`, `ambientCamera`, `ambientParallax`, `ambientOrbit`, `ambientPulse`, or `ambientGradient` threads to `runWithAmbientMotion`. Give every ambient thread the exact visible shot duration. Never let narrative and ambient threads mutate the same node signal concurrently: wrap the object in a narrative pose rig and place a separate ambient rig inside it. Keep ambient frequency low and amplitude subordinate to entrances, clicks, focus changes, and transitions. Use deterministic seeds, protect overscan, and inspect dense frame strips for start jumps, edge exposure, frozen intervals, or visible loop seams. Do not add ambient motion when intentional stillness creates the desired tension.

The scaffold's `review.tsx` is a render-only QA contract. Register critical refs with exact source labels, constraints, allowed overlaps, and centering intent, then keep `ReviewOverlay` last in the tree. It remains invisible in normal renders; `create_visual_review_pack` enables it only in an isolated audit render and extracts the exact marked frames where a registered condition occurs.
