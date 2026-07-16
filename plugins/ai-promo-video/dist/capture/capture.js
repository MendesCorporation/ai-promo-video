import { mkdir, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import { chromium } from 'playwright';
import { CaptureSpecSchema } from '../types.js';
import { readJson, writeJson } from '../utils/files.js';
import { runCommand } from '../utils/process.js';
import { probeVideo } from '../render/probe.js';
async function performAction(page, action) {
    if (action.type === 'wait') {
        await page.waitForTimeout(action.ms);
        return;
    }
    if (action.type === 'scroll') {
        await page.mouse.wheel(action.deltaX, action.deltaY);
    }
    else if (action.type === 'mouse') {
        await page.mouse.move(action.x, action.y, { steps: action.steps });
    }
    else if (action.type === 'goto') {
        await page.goto(new URL(action.url, page.url()).toString(), { waitUntil: 'domcontentloaded' });
    }
    else {
        const locator = page.locator(action.selector).first();
        if (action.type === 'click')
            await locator.click();
        if (action.type === 'fill')
            await locator.fill(action.value);
        if (action.type === 'press')
            await locator.press(action.key);
        if (action.type === 'hover')
            await locator.hover();
        if (action.type === 'select')
            await locator.selectOption(action.value);
        if (action.type === 'check') {
            if (action.checked)
                await locator.check();
            else
                await locator.uncheck();
        }
    }
    if (action.delayMs)
        await page.waitForTimeout(action.delayMs);
}
async function settle(page, waitFor, delayMs = 800) {
    if (waitFor)
        await page.locator(waitFor).first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(delayMs);
    await page.addStyleTag({ content: `
    * { caret-color: transparent !important; }
    html { scroll-behavior: auto !important; }
    body, body * { cursor: none !important; }
  ` });
}
function targetUrl(baseUrl, path) {
    return new URL(path, baseUrl).toString();
}
async function normalizeRecording(input, output) {
    const ffmpegPath = ffmpegPathValue;
    if (!ffmpegPath)
        throw new Error('ffmpeg-static did not provide an FFmpeg binary');
    await runCommand(ffmpegPath, [
        '-y', '-i', input,
        '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-r', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
    ], { quiet: true });
}
export async function captureSite(spec, sourcePath, modes = { screenshots: true, recordings: true }) {
    const parsed = CaptureSpecSchema.parse(spec);
    const outputDir = resolve(dirname(sourcePath), parsed.outputDir);
    await mkdir(outputDir, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: parsed.viewport,
        deviceScaleFactor: 1,
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    try {
        if (parsed.auth) {
            await page.goto(targetUrl(parsed.baseUrl, parsed.auth.path), { waitUntil: 'domcontentloaded' });
            for (const field of parsed.auth.fields) {
                await page.locator(field.selector).first().fill(field.value);
            }
            await Promise.all([
                parsed.auth.waitForUrl
                    ? page.waitForURL(parsed.auth.waitForUrl, { timeout: 15_000 })
                    : page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined),
                page.locator(parsed.auth.submit).first().click(),
            ]);
        }
        const captures = [];
        if (modes.screenshots !== false) {
            for (const target of parsed.targets) {
                await page.goto(targetUrl(parsed.baseUrl, target.path), { waitUntil: 'domcontentloaded' });
                for (const action of target.actions ?? [])
                    await performAction(page, action);
                await settle(page, target.waitFor, target.delayMs);
                const path = join(outputDir, `${target.id}.png`);
                await page.screenshot({ path, type: 'png', fullPage: target.fullPage });
                captures.push({ id: target.id, path, url: page.url(), title: await page.title() });
                console.log(`Captured ${target.id}: ${path}`);
            }
        }
        const recordings = [];
        if (modes.recordings !== false) {
            for (const recording of parsed.recordings) {
                await page.goto(targetUrl(parsed.baseUrl, recording.path), { waitUntil: 'domcontentloaded' });
                await settle(page, recording.waitFor, recording.settleMs);
                const rawPath = join(outputDir, `${recording.id}.webm`);
                const path = join(outputDir, `${recording.id}.mp4`);
                await page.screencast.start({ path: rawPath, size: parsed.viewport, quality: 92 });
                if (recording.pointer === 'annotated') {
                    await page.screencast.showActions({ cursor: 'pointer', duration: 420, fontSize: 0 });
                }
                try {
                    if (recording.preRollMs)
                        await page.waitForTimeout(recording.preRollMs);
                    for (const action of recording.actions)
                        await performAction(page, action);
                    if (recording.postRollMs)
                        await page.waitForTimeout(recording.postRollMs);
                }
                finally {
                    await page.screencast.stop();
                }
                await normalizeRecording(rawPath, path);
                await rm(rawPath, { force: true });
                const metadata = await probeVideo(path);
                recordings.push({
                    id: recording.id,
                    path,
                    url: page.url(),
                    title: await page.title(),
                    duration: metadata.duration,
                    width: metadata.width ?? parsed.viewport.width,
                    height: metadata.height ?? parsed.viewport.height,
                    fps: metadata.fps ?? 30,
                });
                console.log(`Recorded ${recording.id}: ${path}`);
            }
        }
        const result = { outputDir, captures, recordings };
        await writeJson(join(outputDir, 'manifest.json'), result);
        return result;
    }
    finally {
        await context.close();
        await browser.close();
    }
}
export async function captureFromSpecFile(path) {
    const absolutePath = resolve(path);
    const spec = CaptureSpecSchema.parse(await readJson(absolutePath));
    return captureSite(spec, absolutePath);
}
export async function recordFromSpecFile(path) {
    const absolutePath = resolve(path);
    const spec = CaptureSpecSchema.parse(await readJson(absolutePath));
    if (spec.recordings.length === 0)
        throw new Error('Capture spec does not define any recordings');
    return captureSite(spec, absolutePath, { screenshots: false, recordings: true });
}
export async function inspectSite(url, outputPath) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        const result = await page.evaluate(() => {
            const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
            const headings = Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 20).map((node) => node.textContent?.trim()).filter(Boolean);
            const colorCounts = new Map();
            for (const element of Array.from(document.querySelectorAll('*')).slice(0, 500)) {
                const style = getComputedStyle(element);
                for (const color of [style.color, style.backgroundColor, style.borderColor]) {
                    if (!color || color === 'rgba(0, 0, 0, 0)')
                        continue;
                    colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
                }
            }
            const colors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([color]) => color);
            return { title: document.title, description, headings, colors, url: location.href };
        });
        if (outputPath) {
            const absolute = resolve(outputPath);
            await mkdir(dirname(absolute), { recursive: true });
            await page.screenshot({ path: absolute, type: 'png' });
            return { ...result, screenshot: absolute, filename: basename(absolute) };
        }
        return result;
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=capture.js.map