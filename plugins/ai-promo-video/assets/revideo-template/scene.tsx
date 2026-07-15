/** @jsxImportSource @revideo/2d/lib */
import {makeScene2D} from '@revideo/2d';
import {waitFor} from '@revideo/core';

/**
 * Blank composition entry point.
 *
 * Start from the story and art direction. Search motion-library.json, import
 * only useful primitives from motion-library.tsx or kinetic.ts, and freely
 * author custom Revideo nodes in this same file. Do not render this placeholder
 * as a finished video.
 */
export default makeScene2D('composition', function* (view) {
  view.fill('#000000');

  // Replace this pause with the authored scene timeline.
  yield* waitFor(1);
});
