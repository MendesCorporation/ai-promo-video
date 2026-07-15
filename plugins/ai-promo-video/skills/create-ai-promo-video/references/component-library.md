# Motion Component Library

The library is a searchable vocabulary of visual systems, not a gallery of finished templates. It exists to give the host AI many reliable starting points without deciding the video's style.

## Discover

1. Write the shot's narrative job and art direction first.
2. Call `search_motion_components` with useful concepts, categories, moods, tags, or energy. Search multiple needs separately instead of one broad query.
3. Call `get_motion_component` for shortlisted entries. Read its parameters, source exports, and composition notes.
4. Scaffold once. The same catalog is saved as `motion-library.json`; reusable code is in `motion-library.tsx` and `kinetic.ts`.
5. Import only the selected primitives. Restyle, combine, and extend them in the actual scene source.

The catalog covers backgrounds, layouts, typography, product presentation, shapes, transitions, camera, cursor behavior, particles, and effects. Search results are possibilities, not ranked creative recommendations. An empty or broad search is for exploration only.

## Compose

- Build a visual system from the current brand, audience, tension, product behavior, and emotional arc.
- Use custom TypeScript beside library components whenever one-off behavior would be stronger.
- Change deterministic particle seeds, paths, layout proportions, camera targets, palette, typography, and timing to fit the production.
- Prefer a few related components with a shared motion logic over many unrelated effects.
- Preserve visual continuity through direction, depth, objects, type, lighting, or musical accents.

## Originality check

Before rendering, compare the composition against recent work or any supplied examples. If it repeats the same centered headline, card assembly, purple/cyan field, orbit background, camera path, cursor tour, scene count, or musical choice without a story reason, revise the art direction. A component is reusable; a finished combination is not a default.

Do not render the blank scaffold or create a generic film to replace later. The first render should already be the authored production, even if it is a low-resolution timing pass.
