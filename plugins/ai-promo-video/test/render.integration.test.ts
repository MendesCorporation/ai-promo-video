import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { editVideo, mixMusic, replaceVideoRange } from '../src/media/edit.js';
import { probeVideo } from '../src/render/probe.js';
import { renderVideo } from '../src/render/renderer.js';

describe('renderer integration', () => {
  it('renders a valid H.264 MP4 with exact dimensions and duration', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-render-'));
    const specPath = join(directory, 'video.json');
    const output = join(directory, 'smoke.mp4');
    await renderVideo({
      version: 1,
      id: 'render-smoke',
      title: 'Renderer smoke test',
      width: 640,
      height: 360,
      fps: 24,
      duration: 1,
      brand: {
        name: 'Open Promo',
        accent: '#7c5cff',
        accent2: '#31d0aa',
        background: '#070a12',
        foreground: '#f7f8ff',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      },
      scenes: [{ id: 'hero', type: 'hero', duration: 1, title: 'Motion with purpose', transition: 'zoom', align: 'left' }],
      output,
    }, specPath, { workers: 2 });
    await access(output);
    const probe = await probeVideo(output);
    expect(probe).toMatchObject({ width: 640, height: 360, fps: 24, videoCodec: 'h264', hasAudio: false });
    expect(probe.duration).toBeCloseTo(1, 1);

    const mixed = join(directory, 'mixed.mp4');
    await mixMusic({
      inputVideo: output,
      music: join(import.meta.dirname, '../assets/audio/signal-flow.wav'),
      output: mixed,
      baseVolume: 0.2,
      envelope: [{ time: 0, volume: 0 }, { time: 0.2, volume: 1 }, { time: 1, volume: 0 }],
    });
    const mixedProbe = await probeVideo(mixed);
    expect(mixedProbe).toMatchObject({ videoCodec: 'h264', audioCodec: 'aac', hasAudio: true });
    expect(mixedProbe.duration).toBeCloseTo(1, 1);

    const patch = join(directory, 'patch.mp4');
    await editVideo({ input: output, output: patch, start: 0.2, end: 0.7 });
    const patchProbe = await probeVideo(patch);
    expect(patchProbe.duration).toBeCloseTo(0.5, 1);

    const revised = join(directory, 'revised.mp4');
    await replaceVideoRange({ original: output, replacement: patch, output: revised, start: 0.25, end: 0.75 });
    const revisedProbe = await probeVideo(revised);
    expect(revisedProbe).toMatchObject({ width: 640, height: 360, fps: 24, videoCodec: 'h264', hasAudio: false });
    expect(revisedProbe.duration).toBeCloseTo(probe.duration, 1);
  }, 120_000);
});
