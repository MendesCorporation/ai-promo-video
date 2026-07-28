# Free Music Sourcing

Music may come from user-approved local directories, the Freesound, Jamendo, and Wikimedia Audio catalogs exposed through Openverse, or the optional bundled CC0 set. Nothing is selected by default. Write musical intent before searching: emotional direction, energy curve, pacing, desired and undesired instruments, density, and the edit accents the track must support.

Search results are candidates, not recommendations. A viable track passes the license, duration, technical-quality, and declared musical-intent filters. Compare at least three viable tracks when available. If fewer remain after trying two meaningfully different queries or approved sources, compare what exists and record the limitation instead of searching indefinitely. Do not pick the first result, reuse a bundled track because it is convenient, or treat any packaged audio as a fallback. If no candidate fits, leave music out pending a better choice.

## Local search

Search recursively through user-approved folders. Put metadata next to a file as either `track.mp3.json` or `track.json`:

```json
{
  "title": "Track title",
  "creator": "Artist",
  "license": "CC BY 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "attribution": "Track title — Artist — CC BY 4.0",
  "tags": ["technology", "focused", "building"]
}
```

Unknown-license local files are not selectable by default. Enable them only when the user confirms they own or may use the media.

Bundled tracks are excluded from general search unless `includeBundled` is explicitly enabled or `provider` is `bundled`. Use `list_music` only when the user or art direction calls for exploring that small CC0 set.

## Online search

Use `search_music` with `provider: all` for the default aggregate. The returned order is:

1. Freesound through Openverse source filtering.
2. User-approved local libraries.
3. Jamendo through Openverse.
4. Wikimedia Audio through Openverse.

Use `provider: freesound`, `jamendo`, or `wikimedia_audio` to isolate a catalog. Use `provider: openverse` only for an explicit custom `source` or a general Openverse query.

Freesound is the preferred online starting point because its tags, previews, creator metadata, and range of music and sound design make intent-based comparison effective. Access it through Openverse's indexed catalog in the default commercial workflow. Do not call the Freesound API directly unless the user has separately accepted or licensed its API terms; its free API terms are not the default commercial integration path.

Openverse results are restricted to CC0, public-domain, or CC BY material. Download the chosen result through the tool so the audio, original source name, license URL, landing page, and attribution manifest stay together. Confirm the license still matches the source page before publication.

## Compare and analyze

Download or locate the finalists, then call `analyze_music`. Compare duration, loudness, dynamic range, silence, energy curve, and peak-energy times. When `reviewDir` is supplied, inspect the waveform and spectrogram with `read_visual_files`. Use these measurements to find promising excerpts and edit points; they do not replace listening when the host can audition audio.

Record why the selected track fits the story and why the rejected finalists do not. The reason should be about emotion, pacing, arrangement, contrast, and edit structure—not provider order or familiarity.

## Mix

Choose an excerpt whose introduction, build, restraint, and accent locations fit the edit. Use `sourceOffset` instead of assuming the file must begin at zero. Cut on musical phrases where possible. Keep music low enough to support future narration; avoid clipping and check for discontinuities after range replacement. Put required attribution in end credits, accompanying copy, or both according to the license.
