# Free Video and Asset Sourcing

Search for visual media by its role in the shot: subject, action, environment, texture, icon, illustration, transition element, or compositing layer. Do not choose by filename alone; inspect the preview and source page before using it.

## Providers

- Use `search_free_videos` for user-approved local directories, keyless Wikimedia Commons, and optional Pexels stock footage.
- Use `search_free_assets` for local images/SVGs/GIFs, Openverse, Wikimedia Commons, and optional Pexels stock photos.
- Prefer local media when the user already has an approved library. Local search is recursive and reads adjacent license sidecars.
- Openverse and Wikimedia work without a key. Pexels is also free but requires the user's `PEXELS_API_KEY` environment variable and is skipped by `provider: all` when the key is absent. No paid media provider or bundled model is used. Network rate limits still apply.

Use landscape footage for 16:9 compositions unless the shot deliberately needs portrait or square media. Filter by minimum dimensions and duration before reviewing candidates.

## License gate

Default selection permits public-domain, CC0, CC BY, and Pexels License media. CC BY requires attribution. Pexels attribution is encouraged and retained in the manifest even though its media license does not require it. Do not imply that depicted people or brands endorse the SaaS. Share-alike media is disabled by default; enable it only after the user accepts the obligation. Reject non-commercial, no-derivatives, missing, ambiguous, or unsupported licenses.

Unknown-license local media is not selectable unless the user explicitly confirms they own it or may use it. This override applies only to unknown local media, not to clearly restrictive licenses.

## Local sidecars

Place metadata beside a local file as either `clip.mp4.json` or `clip.json`:

```json
{
  "title": "Team reviewing a release",
  "creator": "Studio name",
  "license": "CC BY 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "attribution": "Team reviewing a release — Studio name — CC BY 4.0",
  "tags": ["team", "software", "review"],
  "width": 1920,
  "height": 1080,
  "duration": 12
}
```

## Download and composition

Download a selected online result through `download_free_video` or `download_free_asset`. The tool stores the media, a per-file JSON sidecar, and a shared `credits.json`. Keep these files with the project and verify the source page before publication.

Normalize unsupported containers, crop, color-correct, or trim with the non-destructive video/image editing tools before composition. Preserve the downloaded original. Use sourced media as a designed layer with masks, depth, typography, or camera logic; do not drop unrelated stock footage into the edit.

CLI equivalents:

```text
video:search --query "software team" --provider all --orientation landscape --min-width 1280
video:download <id> --provider wikimedia|pexels --output-dir ./media
asset:search --query "abstract technology" --provider all --kind image --min-width 1200
asset:download <id> --provider openverse|wikimedia|pexels --output-dir ./media
```
