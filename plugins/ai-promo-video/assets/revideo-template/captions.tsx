/** @jsxImportSource @revideo/2d/lib */
import {Layout, Rect, Txt} from '@revideo/2d';
import {Reference, all, delay, easeOutBack, easeOutCubic, waitFor} from '@revideo/core';

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  emphasis?: boolean;
}

export interface CaptionCue {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  precision?: 'word-exact' | 'cue-interpolated';
  words: CaptionWord[];
}

export interface CaptionLaneProps {
  cue: CaptionCue;
  wordRefs: Array<Reference<Txt>>;
  width?: number;
  minHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  gap?: number;
  fill?: string;
  textColor?: string;
  radius?: number;
  padding?: number;
  speakerColor?: string;
  ref?: Reference<Rect>;
  x?: number;
  y?: number;
  position?: [number, number];
  rotation?: number;
  scale?: number;
  opacity?: number;
}

/** Render one semantic caption phrase as measured word nodes that can animate independently. */
export function CaptionLane({
  cue,
  wordRefs,
  width = 920,
  minHeight = 154,
  fontSize = 58,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 760,
  gap = 18,
  fill = '#080a10dc',
  textColor = '#ffffff',
  radius = 30,
  padding = 34,
  speakerColor = '#ffffff99',
  ref,
  x,
  y,
  position,
  rotation,
  scale,
  opacity,
}: CaptionLaneProps) {
  if (wordRefs.length < cue.words.length) throw new Error('CaptionLane requires one word reference per cue word');
  return (
    <Rect ref={ref} x={x} y={y} position={position} rotation={rotation} scale={scale} opacity={opacity} layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={12} width={width} minHeight={minHeight} padding={padding} radius={radius} fill={fill} stroke={'#ffffff18'} lineWidth={2}>
      {cue.speaker ? <Txt text={cue.speaker.toUpperCase()} fill={speakerColor} fontFamily={fontFamily} fontSize={Math.max(18, fontSize * 0.32)} fontWeight={700} letterSpacing={3} /> : null}
      <Layout layout wrap={'wrap'} justifyContent={'center'} alignItems={'center'} columnGap={gap} rowGap={Math.round(gap * 0.72)} width={width - padding * 2}>
        {cue.words.map((word, index) => <Txt ref={wordRefs[index]} text={word.text} fill={textColor} fontFamily={fontFamily} fontSize={fontSize} fontWeight={fontWeight} lineHeight={fontSize * 1.12} />)}
      </Layout>
    </Rect>
  );
}

export interface WordFollowOptions {
  textColor?: string;
  activeColor?: string;
  inactiveOpacity?: number;
  activeScale?: number;
  activeLift?: number;
  attack?: number;
  release?: number;
  mode?: 'follow' | 'karaoke' | 'punch';
}

/**
 * Play exact or interpolated word timing without rebuilding the layout. The
 * caller starts this generator at cue.start on the master timeline.
 */
export function* playWordFollowCaption(refs: Array<Reference<Txt>>, cue: CaptionCue, options: WordFollowOptions = {}) {
  if (refs.length < cue.words.length) throw new Error('playWordFollowCaption requires one reference per cue word');
  const textColor = options.textColor ?? '#ffffff';
  const activeColor = options.activeColor ?? '#ffe66d';
  const inactiveOpacity = options.inactiveOpacity ?? 0.52;
  const activeScale = options.activeScale ?? 1.16;
  const activeLift = options.activeLift ?? 10;
  const attack = options.attack ?? 0.09;
  const release = options.release ?? 0.16;
  const mode = options.mode ?? 'follow';
  const origins = cue.words.map((_, index) => refs[index]().y());
  refs.slice(0, cue.words.length).forEach((ref) => {
    ref().fill(textColor);
    ref().opacity(inactiveOpacity);
    ref().scale(1);
  });

  const pulses = cue.words.map((word, index) => delay(Math.max(0, word.start - cue.start), (function* () {
    const node = refs[index]();
    const emphasized = mode === 'punch' && word.emphasis;
    const targetScale = activeScale * (emphasized ? 1.22 : 1);
    const targetLift = activeLift * (emphasized ? 1.25 : 1);
    const activeDuration = Math.max(0, word.end - word.start);
    const hold = Math.max(0, activeDuration - attack - release);
    yield* all(
      node.fill(activeColor, attack, easeOutCubic),
      node.opacity(1, attack, easeOutCubic),
      node.scale(targetScale, attack, easeOutBack),
      node.y(origins[index] - targetLift, attack, easeOutCubic),
    );
    if (hold > 0) yield* waitFor(hold);
    yield* all(
      node.fill(mode === 'karaoke' ? activeColor : textColor, release, easeOutCubic),
      node.opacity(mode === 'karaoke' ? 0.9 : inactiveOpacity, release, easeOutCubic),
      node.scale(1, release, easeOutCubic),
      node.y(origins[index], release, easeOutCubic),
    );
  })()));
  yield* all(...pulses, waitFor(Math.max(0.001, cue.end - cue.start)));

  refs.slice(0, cue.words.length).forEach((ref) => {
    ref().fill(textColor);
    ref().opacity(1);
    ref().scale(1);
  });
}

export function* playKaraokeCaption(refs: Array<Reference<Txt>>, cue: CaptionCue, options: Omit<WordFollowOptions, 'mode'> = {}) {
  yield* playWordFollowCaption(refs, cue, {...options, mode: 'karaoke'});
}

export function* playPunchCaption(refs: Array<Reference<Txt>>, cue: CaptionCue, options: Omit<WordFollowOptions, 'mode'> = {}) {
  yield* playWordFollowCaption(refs, cue, {...options, mode: 'punch'});
}

export function captionLaneY(frameHeight: number, safeBottom: number, laneHeight: number, margin = 36): number {
  return frameHeight / 2 - safeBottom - laneHeight / 2 - margin;
}
