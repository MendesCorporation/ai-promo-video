import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import { z } from 'zod';
import { probeVideo } from '../render/probe.js';
import { runCommand } from '../utils/process.js';
const CropSchema = z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
});
const ResizeSchema = z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fit: z.enum(['contain', 'cover', 'stretch']).default('contain'),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#000000'),
});
const ColorSchema = z.object({
    brightness: z.number().min(-1).max(1).default(0),
    contrast: z.number().min(0).max(3).default(1),
    saturation: z.number().min(0).max(3).default(1),
    gamma: z.number().min(0.1).max(10).default(1),
});
const RemoveColorSchema = z.object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
    similarity: z.number().min(0.01).max(1).default(0.12),
    blend: z.number().min(0).max(1).default(0.04),
});
export const ImageEditSchema = z.object({
    input: z.string().min(1),
    output: z.string().min(1),
    crop: CropSchema.optional(),
    resize: ResizeSchema.optional(),
    color: ColorSchema.optional(),
    blur: z.number().min(0).max(100).optional(),
    removeColor: RemoveColorSchema.optional(),
});
export const VideoEditSchema = z.object({
    input: z.string().min(1),
    output: z.string().regex(/\.mp4$/i),
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
    speed: z.number().min(0.25).max(4).default(1),
    crop: CropSchema.optional(),
    resize: ResizeSchema.optional(),
    color: ColorSchema.optional(),
    blur: z.number().min(0).max(100).optional(),
    fadeIn: z.number().min(0).max(10).default(0),
    fadeOut: z.number().min(0).max(10).default(0),
    volume: z.number().min(0).max(4).default(1),
    mute: z.boolean().default(false),
});
export const ReplaceVideoRangeSchema = z.object({
    original: z.string().min(1),
    replacement: z.string().min(1),
    output: z.string().regex(/\.mp4$/i),
    start: z.number().nonnegative(),
    end: z.number().positive(),
}).refine((value) => value.end > value.start, { path: ['end'], message: 'end must be greater than start' });
const MusicEnvelopePointSchema = z.object({
    time: z.number().nonnegative(),
    volume: z.number().min(0).max(4),
});
export const MixMusicSchema = z.object({
    inputVideo: z.string().min(1),
    music: z.string().min(1),
    output: z.string().regex(/\.mp4$/i),
    baseVolume: z.number().min(0).max(4).default(0.25),
    sourceOffset: z.number().nonnegative().default(0),
    loop: z.boolean().default(true),
    preserveOriginalAudio: z.boolean().default(false),
    originalVolume: z.number().min(0).max(4).default(1),
    envelope: z.array(MusicEnvelopePointSchema).min(1).max(100).default([{ time: 0, volume: 1 }]),
});
function ffmpegPath() {
    const value = ffmpegPathValue;
    if (!value)
        throw new Error('ffmpeg-static did not provide an FFmpeg binary');
    return value;
}
function resizeFilters(resize) {
    if (resize.fit === 'stretch')
        return [`scale=${resize.width}:${resize.height}`];
    const force = resize.fit === 'cover' ? 'increase' : 'decrease';
    const filters = [`scale=${resize.width}:${resize.height}:force_original_aspect_ratio=${force}`];
    if (resize.fit === 'cover')
        filters.push(`crop=${resize.width}:${resize.height}`);
    else
        filters.push(`pad=${resize.width}:${resize.height}:(ow-iw)/2:(oh-ih)/2:color=${resize.background}`);
    return filters;
}
function visualFilters(options) {
    const filters = [];
    if (options.crop)
        filters.push(`crop=${options.crop.width}:${options.crop.height}:${options.crop.x}:${options.crop.y}`);
    if (options.resize)
        filters.push(...resizeFilters(options.resize));
    if (options.color)
        filters.push(`eq=brightness=${options.color.brightness}:contrast=${options.color.contrast}:saturation=${options.color.saturation}:gamma=${options.color.gamma}`);
    if (options.blur && options.blur > 0)
        filters.push(`gblur=sigma=${options.blur}`);
    if (options.removeColor)
        filters.push(`colorkey=${options.removeColor.color.replace('#', '0x')}:${options.removeColor.similarity}:${options.removeColor.blend}`, 'format=rgba');
    return filters;
}
function atempoFilters(speed) {
    const filters = [];
    let remaining = speed;
    while (remaining > 2) {
        filters.push('atempo=2');
        remaining /= 2;
    }
    while (remaining < 0.5) {
        filters.push('atempo=0.5');
        remaining /= 0.5;
    }
    filters.push(`atempo=${remaining}`);
    return filters;
}
function number(value) {
    return Number(value.toFixed(6)).toString();
}
/** Build a frame-evaluated, piecewise-linear FFmpeg gain expression. */
export function musicEnvelopeExpression(points) {
    if (!points.length)
        throw new Error('Music envelope requires at least one point');
    for (let index = 1; index < points.length; index += 1) {
        if (points[index].time <= points[index - 1].time)
            throw new Error('Music envelope times must be strictly increasing');
    }
    let expression = number(points.at(-1).volume);
    for (let index = points.length - 2; index >= 0; index -= 1) {
        const from = points[index];
        const to = points[index + 1];
        const slope = (to.volume - from.volume) / (to.time - from.time);
        const linear = `${number(from.volume)}+(${number(slope)})*(t-${number(from.time)})`;
        expression = `if(lt(t,${number(to.time)}),${linear},${expression})`;
    }
    const first = points[0];
    return first.time > 0 ? `if(lt(t,${number(first.time)}),${number(first.volume)},${expression})` : expression;
}
export async function editImage(value) {
    const options = ImageEditSchema.parse(value);
    const outputPath = resolve(options.output);
    await mkdir(dirname(outputPath), { recursive: true });
    const filters = visualFilters(options);
    const args = ['-y', '-i', resolve(options.input)];
    if (filters.length)
        args.push('-vf', filters.join(','));
    args.push('-frames:v', '1', outputPath);
    await runCommand(ffmpegPath(), args, { quiet: true });
    return { outputPath, filters };
}
export async function editVideo(value) {
    const options = VideoEditSchema.parse(value);
    const inputPath = resolve(options.input);
    const outputPath = resolve(options.output);
    const input = await probeVideo(inputPath);
    const start = options.start ?? 0;
    const end = options.end ?? input.duration;
    if (end <= start || end > input.duration + 0.05)
        throw new Error(`Invalid edit range ${start}–${end}s for ${input.duration}s input`);
    const duration = (end - start) / options.speed;
    const videoFilters = visualFilters(options);
    if (options.speed !== 1)
        videoFilters.push(`setpts=PTS/${options.speed}`);
    if (options.fadeIn > 0)
        videoFilters.push(`fade=t=in:st=0:d=${Math.min(options.fadeIn, duration)}`);
    if (options.fadeOut > 0)
        videoFilters.push(`fade=t=out:st=${Math.max(0, duration - options.fadeOut)}:d=${Math.min(options.fadeOut, duration)}`);
    const audioFilters = [];
    if (options.speed !== 1)
        audioFilters.push(...atempoFilters(options.speed));
    if (options.volume !== 1)
        audioFilters.push(`volume=${options.volume}`);
    if (options.fadeIn > 0)
        audioFilters.push(`afade=t=in:st=0:d=${Math.min(options.fadeIn, duration)}`);
    if (options.fadeOut > 0)
        audioFilters.push(`afade=t=out:st=${Math.max(0, duration - options.fadeOut)}:d=${Math.min(options.fadeOut, duration)}`);
    await mkdir(dirname(outputPath), { recursive: true });
    const args = ['-y', '-ss', String(start), '-to', String(end), '-i', inputPath, '-map', '0:v:0'];
    if (!options.mute && input.hasAudio)
        args.push('-map', '0:a:0');
    if (videoFilters.length)
        args.push('-vf', videoFilters.join(','));
    if (!options.mute && input.hasAudio && audioFilters.length)
        args.push('-af', audioFilters.join(','));
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p');
    if (!options.mute && input.hasAudio)
        args.push('-c:a', 'aac', '-b:a', '192k');
    else
        args.push('-an');
    args.push('-movflags', '+faststart', outputPath);
    await runCommand(ffmpegPath(), args, { quiet: true });
    return { outputPath, duration, filters: { video: videoFilters, audio: audioFilters } };
}
export async function replaceVideoRange(value) {
    const options = ReplaceVideoRangeSchema.parse(value);
    const originalPath = resolve(options.original);
    const replacementPath = resolve(options.replacement);
    const outputPath = resolve(options.output);
    const [original, replacement] = await Promise.all([probeVideo(originalPath), probeVideo(replacementPath)]);
    const patchDuration = options.end - options.start;
    if (options.end > original.duration + 0.05)
        throw new Error(`Replacement end ${options.end}s exceeds original duration ${original.duration}s`);
    if (Math.abs(replacement.duration - patchDuration) > 0.12) {
        throw new Error(`Replacement is ${replacement.duration}s but selected range is ${patchDuration}s; render an exact advanced range first`);
    }
    if (original.hasAudio !== replacement.hasAudio)
        throw new Error('Original and replacement must either both contain audio or both be silent');
    if (!original.width || !original.height || !original.fps)
        throw new Error('Could not determine the original video dimensions or frame rate');
    await mkdir(dirname(outputPath), { recursive: true });
    const videoParts = [
        `[0:v]trim=start=0:end=${options.start},setpts=PTS-STARTPTS[v0]`,
        `[1:v]trim=start=0:end=${patchDuration},setpts=PTS-STARTPTS,scale=${original.width}:${original.height},fps=${original.fps},format=yuv420p[v1]`,
        `[0:v]trim=start=${options.end}:end=${original.duration},setpts=PTS-STARTPTS[v2]`,
    ];
    const args = ['-y', '-i', originalPath, '-i', replacementPath];
    if (original.hasAudio) {
        const audioParts = [
            `[0:a]atrim=start=0:end=${options.start},asetpts=PTS-STARTPTS[a0]`,
            `[1:a]atrim=start=0:end=${patchDuration},asetpts=PTS-STARTPTS[a1]`,
            `[0:a]atrim=start=${options.end}:end=${original.duration},asetpts=PTS-STARTPTS[a2]`,
        ];
        args.push('-filter_complex', [...videoParts, ...audioParts, '[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]'].join(';'), '-map', '[v]', '-map', '[a]');
    }
    else {
        args.push('-filter_complex', [...videoParts, '[v0][v1][v2]concat=n=3:v=1:a=0[v]'].join(';'), '-map', '[v]');
    }
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p');
    if (original.hasAudio)
        args.push('-c:a', 'aac', '-b:a', '192k');
    args.push('-movflags', '+faststart', outputPath);
    await runCommand(ffmpegPath(), args, { quiet: true });
    return { outputPath, duration: original.duration, replaced: [options.start, options.end] };
}
export async function mixMusic(value) {
    const options = MixMusicSchema.parse(value);
    const inputPath = resolve(options.inputVideo);
    const musicPath = resolve(options.music);
    const outputPath = resolve(options.output);
    if (inputPath === outputPath)
        throw new Error('Music mix output must differ from the input video');
    const input = await probeVideo(inputPath);
    if (options.envelope.some((point) => point.time > input.duration + 0.05)) {
        throw new Error(`Music envelope extends beyond the ${input.duration}s video duration`);
    }
    const expression = musicEnvelopeExpression(options.envelope);
    const musicFilter = `[1:a]atrim=duration=${number(input.duration)},asetpts=PTS-STARTPTS,volume='${number(options.baseVolume)}*(${expression})':eval=frame[music]`;
    const filters = [musicFilter];
    let audioMap = '[music]';
    if (options.preserveOriginalAudio && input.hasAudio) {
        filters.push(`[0:a]atrim=duration=${number(input.duration)},asetpts=PTS-STARTPTS,volume=${number(options.originalVolume)}[original]`);
        filters.push('[original][music]amix=inputs=2:duration=first:dropout_transition=0[audio]');
        audioMap = '[audio]';
    }
    await mkdir(dirname(outputPath), { recursive: true });
    const args = ['-y', '-i', inputPath];
    if (options.loop)
        args.push('-stream_loop', '-1');
    if (options.sourceOffset > 0)
        args.push('-ss', number(options.sourceOffset));
    args.push('-i', musicPath, '-filter_complex', filters.join(';'), '-map', '0:v:0', '-map', audioMap, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', number(input.duration), '-movflags', '+faststart', outputPath);
    await runCommand(ffmpegPath(), args, { quiet: true });
    return { outputPath, duration: input.duration, envelope: options.envelope, preservedOriginalAudio: options.preserveOriginalAudio && input.hasAudio };
}
//# sourceMappingURL=edit.js.map