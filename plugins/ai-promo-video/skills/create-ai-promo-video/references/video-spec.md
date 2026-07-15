# Legacy JSON Video Spec

This format exists only to maintain an existing version 1 project or fulfill an explicit compatibility request. Do not use it for a new production, do not render it as a draft, and do not convert it into a Revideo film after rendering. New work starts directly in the neutral Revideo scaffold.

The renderer accepts a version 1 JSON plan. Scene durations must sum to the exact video duration.

```json
{
  "version": 1,
  "id": "launch-promo",
  "title": "Launch promo",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 30,
  "brand": {
    "name": "Acme",
    "logo": "./logo.png",
    "accent": "#7C5CFF",
    "accent2": "#31D0AA",
    "background": "#070A12",
    "foreground": "#F7F8FF"
  },
  "scenes": [],
  "output": "./output/promo.mp4"
}
```

All scenes require `id`, `type`, `duration`, and `title`. Types are `hero`, `product`, `features`, `metrics`, and `cta`; transitions are `fade`, `push`, `wipe`, and `zoom`.

- `product`: add `media`; optionally add normalized `focus.x`, `focus.y`, and a `scale` from 1 to 2.5.
- `features`: add up to six `bullets`; three works best at 16:9.
- `metrics`: add `media` and up to four `{ "label", "value" }` objects.
- `cta`: add a short `badge` for the action or URL.

Logo, media, and output paths are relative to the video spec.
