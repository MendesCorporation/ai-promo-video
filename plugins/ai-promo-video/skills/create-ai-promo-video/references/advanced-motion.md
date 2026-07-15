# Advanced Motion Direction

The advanced engine is Revideo TypeScript authored by the host AI. Use `list_motion_capabilities`, scaffold a project, save or patch its source, and render it headlessly. Assets placed in the project or parent `public` folder are available to browser media nodes.

## Product-screen patterns

### Perspective reveal

Place a screenshot or recording in a clipped, rounded frame. Animate scale, rotation, skew/perspective, position, shadow, and background parallax together. For a hero-quality 3D camera move, map the product texture to Three.js geometry and animate a perspective camera instead of stacking unrelated 2D transforms.

### UI assembly

Start with the outer product frame. Introduce sidebar and header, then cards, rows, controls, and data with short staggered motion. Preserve believable containment. Crossfade or morph into the real screenshot before the shot ends so the construction proves a real product.

### Cursor and click

Use an SVG path or vector cursor above the clean recording. Animate it along a deliberate route with eased arrival. On click, briefly scale it down, emit a ring, change the target, and add a subtle camera response. Never drift a cursor for decoration.

### Abstract depth

Use blurred light fields, orbital geometry, procedural shapes, particles, paths, gradients, or shader surfaces to create an environment. Connect the environment to the brand palette and product movement. Avoid generic floating blobs with no interaction.

### Cards and typography

Cards should arrive with hierarchy: container, number/icon, title, supporting copy. Vary rotation and depth while keeping the settle readable. Typography can reveal by line, word, mask, or path, but retain enough stable screen time for comprehension.

The scaffold includes `kinetic.ts` with reusable tracking reveal, word cascade, impact, per-letter rise, animated gradient, typewriter, erase/rewrite, phrase swap, text-push, and measured-row primitives. Treat them as a starting vocabulary, not a mandatory template. Link type scale, tracking, blur, direction, and exit motion to the camera move or transition that follows so text behaves as a scene object instead of a caption. Use measured rows when words are separate nodes; temporary tracking may be expressive, but the settled phrase must pass optical-spacing review.

## Media

`Img`, `Video`, `Audio`, `SVG`, vector `Path`, and procedural nodes may share a scene. Use the web video decoder for local MP4 assets. Edit derived captures before composition when crop, color, redaction, chroma removal, timing, speed, or fades improve the source; keep originals intact.

## Timing

Write explicit scene boundary comments and keep the source timeline stable. This makes interval-only rendering and final MP4 replacement safe. Use shared palette, direction, scale, object, or rhythm to carry energy through cuts.
