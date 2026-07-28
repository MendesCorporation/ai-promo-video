/** @jsxImportSource @revideo/2d/lib */
import {Layout, Line, Rect, Txt, type Node} from '@revideo/2d';
import {type Reference, useScene} from '@revideo/core';

export type ReviewRole = 'text' | 'logo' | 'cta' | 'product' | 'caption' | 'decoration';
export type ReviewAxis = 'x' | 'y' | 'both';
export type ReviewBounds = {left: number; top: number; right: number; bottom: number};
export type ReviewCenterTarget = 'frame' | 'safe-area' | {x: number; y: number};

export interface ReviewElement {
  id: string;
  role: ReviewRole;
  ref: Reference<Node>;
  /** Human-readable source pointer, for example scene.tsx:84 heroHeadline. */
  source: string;
  constrainTo?: 'frame' | 'safe-area' | ReviewBounds;
  collision?: boolean;
  allowOverlapWith?: string[];
  center?: ReviewCenterTarget;
  centerAxis?: ReviewAxis;
  centerTolerance?: number;
  /** Perceptual correction in frame pixels, applied before checking center. */
  opticalOffset?: [number, number];
}

export interface ReviewRegistryOptions {
  width: number;
  height: number;
  safeAreaPixels?: {top: number; right: number; bottom: number; left: number};
}

export interface ReviewIssue {
  type: 'overflow' | 'collision' | 'off-center';
  ids: string[];
  sources: string[];
  message: string;
  bounds: ReviewBounds[];
  target?: ReviewBounds;
}

export interface ReviewRegistry {
  register(element: ReviewElement): void;
  elements(): ReviewElement[];
  issues(): ReviewIssue[];
  frameBounds(): ReviewBounds;
  safeBounds(): ReviewBounds;
}

const EMPTY_SAFE_AREA = {top: 0, right: 0, bottom: 0, left: 0};

function worldBounds(node: Node, width: number, height: number): ReviewBounds {
  const points = node.cacheBBox().transformCorners(node.localToWorld());
  return {
    left: Math.min(...points.map((point) => point.x)) - width / 2,
    top: Math.min(...points.map((point) => point.y)) - height / 2,
    right: Math.max(...points.map((point) => point.x)) - width / 2,
    bottom: Math.max(...points.map((point) => point.y)) - height / 2,
  };
}

function nodeVisible(node: Node): boolean {
  let current: Node | null = node;
  let opacity = 1;
  while (current) {
    opacity *= current.opacity();
    current = current.parent();
  }
  return opacity > 0.015;
}

function inside(inner: ReviewBounds, outer: ReviewBounds, tolerance = 1): boolean {
  return inner.left >= outer.left - tolerance
    && inner.top >= outer.top - tolerance
    && inner.right <= outer.right + tolerance
    && inner.bottom <= outer.bottom + tolerance;
}

function intersection(first: ReviewBounds, second: ReviewBounds): ReviewBounds | undefined {
  const bounds = {
    left: Math.max(first.left, second.left),
    top: Math.max(first.top, second.top),
    right: Math.min(first.right, second.right),
    bottom: Math.min(first.bottom, second.bottom),
  };
  return bounds.right - bounds.left > 4 && bounds.bottom - bounds.top > 4 ? bounds : undefined;
}

function center(bounds: ReviewBounds): [number, number] {
  return [(bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2];
}

function targetCenter(target: ReviewCenterTarget, frame: ReviewBounds, safe: ReviewBounds): [number, number] {
  if (target === 'frame') return center(frame);
  if (target === 'safe-area') return center(safe);
  return [target.x, target.y];
}

function boundsSize(bounds: ReviewBounds): [number, number] {
  return [Math.max(1, bounds.right - bounds.left), Math.max(1, bounds.bottom - bounds.top)];
}

function boundsPosition(bounds: ReviewBounds): [number, number] {
  return center(bounds);
}

function overlapAllowed(first: ReviewElement, second: ReviewElement): boolean {
  return first.allowOverlapWith?.includes(second.id) === true
    || second.allowOverlapWith?.includes(first.id) === true;
}

export function createReviewRegistry(options: ReviewRegistryOptions): ReviewRegistry {
  const entries: ReviewElement[] = [];
  const frame: ReviewBounds = {
    left: -options.width / 2,
    top: -options.height / 2,
    right: options.width / 2,
    bottom: options.height / 2,
  };
  const inset = options.safeAreaPixels ?? EMPTY_SAFE_AREA;
  const safe: ReviewBounds = {
    left: frame.left + inset.left,
    top: frame.top + inset.top,
    right: frame.right - inset.right,
    bottom: frame.bottom - inset.bottom,
  };

  return {
    register(element) {
      if (entries.some((entry) => entry.id === element.id)) {
        throw new Error(`Duplicate review element id: ${element.id}`);
      }
      entries.push(element);
    },
    elements: () => [...entries],
    frameBounds: () => frame,
    safeBounds: () => safe,
    issues() {
      const active = entries
        .filter((entry) => nodeVisible(entry.ref()))
        .map((entry) => ({entry, bounds: worldBounds(entry.ref(), options.width, options.height)}));
      const issues: ReviewIssue[] = [];

      for (const item of active) {
        const constraint = item.entry.constrainTo === 'safe-area'
          ? safe
          : item.entry.constrainTo === 'frame' || !item.entry.constrainTo
            ? frame
            : item.entry.constrainTo;
        if (!inside(item.bounds, constraint)) {
          issues.push({
            type: 'overflow',
            ids: [item.entry.id],
            sources: [item.entry.source],
            message: `${item.entry.id} exceeds ${item.entry.constrainTo ?? 'frame'}`,
            bounds: [item.bounds],
            target: constraint,
          });
        }

        if (item.entry.center) {
          const actual = center(item.bounds);
          const expected = targetCenter(item.entry.center, frame, safe);
          const optical = item.entry.opticalOffset ?? [0, 0];
          const deltaX = actual[0] + optical[0] - expected[0];
          const deltaY = actual[1] + optical[1] - expected[1];
          const tolerance = item.entry.centerTolerance ?? 8;
          const axis = item.entry.centerAxis ?? 'both';
          const failsX = axis !== 'y' && Math.abs(deltaX) > tolerance;
          const failsY = axis !== 'x' && Math.abs(deltaY) > tolerance;
          if (failsX || failsY) {
            issues.push({
              type: 'off-center',
              ids: [item.entry.id],
              sources: [item.entry.source],
              message: `${item.entry.id} center differs by ${deltaX.toFixed(1)}px x / ${deltaY.toFixed(1)}px y`,
              bounds: [item.bounds],
              target: {
                left: expected[0] - tolerance,
                top: expected[1] - tolerance,
                right: expected[0] + tolerance,
                bottom: expected[1] + tolerance,
              },
            });
          }
        }
      }

      for (let firstIndex = 0; firstIndex < active.length; firstIndex += 1) {
        const first = active[firstIndex];
        if (first.entry.collision === false || first.entry.role === 'decoration') continue;
        for (let secondIndex = firstIndex + 1; secondIndex < active.length; secondIndex += 1) {
          const second = active[secondIndex];
          if (second.entry.collision === false || second.entry.role === 'decoration' || overlapAllowed(first.entry, second.entry)) continue;
          const overlap = intersection(first.bounds, second.bounds);
          if (!overlap) continue;
          issues.push({
            type: 'collision',
            ids: [first.entry.id, second.entry.id],
            sources: [first.entry.source, second.entry.source],
            message: `${first.entry.id} overlaps ${second.entry.id}`,
            bounds: [first.bounds, second.bounds, overlap],
          });
        }
      }
      return issues;
    },
  };
}

const issueColor = (type: ReviewIssue['type']): string => type === 'overflow'
  ? '#ff3b5c'
  : type === 'collision'
    ? '#ffb020'
    : '#38d6ff';

/**
 * Render-only QA overlay. It remains invisible in normal renders and is enabled
 * by create_visual_review_pack through __AI_PROMO_REVIEW_OVERLAY__.
 */
export function ReviewOverlay({registry}: {registry: ReviewRegistry}) {
  const enabled = useScene().variables.get('__AI_PROMO_REVIEW_OVERLAY__', false);
  const frame = registry.frameBounds();
  const safe = registry.safeBounds();
  const issues = () => enabled() ? registry.issues() : [];
  const issueTypes: ReviewIssue['type'][] = ['off-center', 'overflow', 'collision'];
  const registered = registry.elements();
  const issueFor = (id: string, type: ReviewIssue['type']) => issues()
    .find((issue) => issue.type === type && issue.ids.includes(id));
  const issueBoundsFor = (id: string, type: ReviewIssue['type']): ReviewBounds => {
    const issue = issueFor(id, type);
    if (!issue) return {left: 0, top: 0, right: 1, bottom: 1};
    const index = Math.max(0, issue.ids.indexOf(id));
    return issue.bounds[Math.min(index, issue.bounds.length - 1)];
  };
  const pairIssue = (first: string, second: string) => issues().find((issue) =>
    issue.type === 'collision' && issue.ids.includes(first) && issue.ids.includes(second));
  const registeredPairs = registered.flatMap((first, firstIndex) =>
    registered.slice(firstIndex + 1).map((second) => [first, second] as const));
  const headerHeight = Math.min((frame.bottom - frame.top) * 0.28, 90 + Math.ceil(registered.length / 2) * 24);
  const headerColumnWidth = (frame.right - frame.left - 72) / 2;

  return <Layout opacity={() => enabled() ? 1 : 0} zIndex={1_000_000}>
    <Rect
      position={boundsPosition(safe)}
      size={boundsSize(safe)}
      stroke={'#38d6ff'}
      lineWidth={2}
      lineDash={[12, 8]}
      opacity={0.5}
    />
    <Line points={[[0, frame.top], [0, frame.bottom]]} stroke={'#38d6ff'} lineWidth={1} opacity={0.35} />
    <Line points={[[frame.left, 0], [frame.right, 0]]} stroke={'#38d6ff'} lineWidth={1} opacity={0.35} />
    {registered.flatMap((entry) => issueTypes.flatMap((type) => [
      <Rect
        key={`${entry.id}-${type}-bounds`}
        position={() => boundsPosition(issueBoundsFor(entry.id, type))}
        size={() => boundsSize(issueBoundsFor(entry.id, type))}
        stroke={issueColor(type)}
        lineWidth={type === 'collision' ? 7 : type === 'overflow' ? 4 : 2}
        opacity={() => issueFor(entry.id, type) ? 1 : 0}
      />,
      <Rect
        key={`${entry.id}-${type}-target`}
        position={() => boundsPosition(issueFor(entry.id, type)?.target ?? {left: 0, top: 0, right: 1, bottom: 1})}
        size={() => boundsSize(issueFor(entry.id, type)?.target ?? {left: 0, top: 0, right: 1, bottom: 1})}
        stroke={issueColor(type)}
        lineWidth={2}
        lineDash={[8, 6]}
        opacity={() => issueFor(entry.id, type)?.target ? 0.75 : 0}
      />,
    ]))}
    {registeredPairs.flatMap(([first, second]) => [
      <Rect
        key={`${first.id}-${second.id}-intersection`}
        position={() => boundsPosition(pairIssue(first.id, second.id)?.bounds.at(-1) ?? {left: 0, top: 0, right: 1, bottom: 1})}
        size={() => boundsSize(pairIssue(first.id, second.id)?.bounds.at(-1) ?? {left: 0, top: 0, right: 1, bottom: 1})}
        fill={'#ffb02044'}
        stroke={'#ffb020'}
        lineWidth={5}
        opacity={() => pairIssue(first.id, second.id) ? 1 : 0}
      />,
    ])}
    <Rect
      position={[0, frame.top + headerHeight / 2]}
      width={frame.right - frame.left}
      height={headerHeight}
      fill={'#05070aee'}
      stroke={() => issues().length > 0 ? '#ff3b5c' : '#35d07f'}
      lineWidth={3}
      zIndex={10}
    />
    <Txt
      position={[0, frame.top + 25]}
      width={frame.right - frame.left - 80}
      textAlign={'left'}
      fontFamily={'Arial'}
      fontWeight={700}
      fontSize={20}
      fill={'#ffffff'}
      text={'LAYOUT AUDIT · inspect whether each marked condition is intentional'}
      zIndex={11}
    />
    <Txt
      position={[0, frame.top + 53]}
      width={frame.right - frame.left - 80}
      textAlign={'left'}
      fontFamily={'Arial'}
      fontSize={15}
      fill={'#b8c3d1'}
      text={'RED overflow · AMBER collision · CYAN off-center · dashed boxes are constraints/targets'}
      zIndex={11}
    />
    {registered.map((entry, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return <Txt
        key={`${entry.id}-header-source`}
        position={[
          frame.left + 36 + headerColumnWidth / 2 + column * headerColumnWidth,
          frame.top + 82 + row * 24,
        ]}
        width={headerColumnWidth - 12}
        textAlign={'left'}
        fontFamily={'Arial'}
        fontWeight={700}
        fontSize={15}
        fill={() => issueColor(issues().find((issue) => issue.ids.includes(entry.id))?.type ?? 'overflow')}
        text={`${entry.id} · ${entry.source}`}
        opacity={() => issues().some((issue) => issue.ids.includes(entry.id)) ? 1 : 0}
        zIndex={11}
      />;
    })}
    <Rect
      position={[frame.left + 16, frame.top + 16]}
      size={24}
      fill={() => issues().length > 0 ? '#ffffff' : '#000000'}
      zIndex={12}
    />
  </Layout>;
}
