# Revideo Composition Direction

Revideo TypeScript is the production engine for every new video. Use `list_motion_capabilities`, search the component vocabulary, scaffold one neutral project, author or patch its source, and render it headlessly. Assets placed in the project or parent `public` folder are available to browser media nodes.

The scaffold is intentionally blank. It ships `motion-library.tsx`, `kinetic.ts`, and `motion-library.json`, not a sample film. Select, combine, restyle, or rewrite components inside the real production. Custom TypeScript, Three.js, shaders, SVG geometry, and one-off timing live beside library components in the same scene; there is no separate “template mode” and “advanced mode.”

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

The scaffold includes `kinetic.ts` with reusable tracking reveal, word cascade, impact, per-letter rise, animated gradient, typewriter, erase/rewrite, phrase swap, text-push, and measured-row primitives. `motion-library.tsx` adds backgrounds, product frames, camera helpers, cursor feedback, particles, routes, focus systems, and composable surfaces. Treat them as a vocabulary, not a mandatory look. Link type scale, tracking, blur, direction, and exit motion to the camera move or transition that follows so text behaves as a scene object instead of a caption. Use measured rows when words are separate nodes; temporary tracking may be expressive, but the settled phrase must pass optical-spacing review.

Search by the current shot's need, such as “camera follows assembling navigation,” “quiet emotional depth,” or “type becomes a transition mask.” Combine only a small coherent subset. If the exact behavior is absent, author it directly instead of approximating the story with a near-matching component.

## Media

`Img`, `Video`, `Audio`, `SVG`, vector `Path`, and procedural nodes may share a scene. Use the web video decoder for local MP4 assets. Edit derived captures before composition when crop, color, redaction, chroma removal, timing, speed, or fades improve the source; keep originals intact.

## Timing

Write explicit scene boundary comments and keep the source timeline stable. This makes interval-only rendering and final MP4 replacement safe. Use shared palette, direction, scale, object, or rhythm to carry energy through cuts.
