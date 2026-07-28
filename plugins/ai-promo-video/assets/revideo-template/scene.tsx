/** @jsxImportSource @revideo/2d/lib */
import {makeScene2D} from '@revideo/2d';
import {waitFor} from '@revideo/core';
import profile from './format-profile.json';
import {createReviewRegistry, ReviewOverlay} from './review';

/**
 * Blank composition entry point.
 *
 * Start from the story and art direction. Search the MCP motion catalog, then
 * add only the source helpers the shot actually needs with
 * add_advanced_video_helpers. Every helper is optional: freely customize,
 * combine, replace, or ignore it and author any compatible Revideo, GLSL, SVG,
 * or Three.js behavior in this same production. Do not render this placeholder
 * as a finished video.
 */
export default makeScene2D('composition', function* (view) {
  view.fill('#000000');
  const review = createReviewRegistry({
    width: profile.width,
    height: profile.height,
    safeAreaPixels: profile.safeAreaPixels,
  });

  // Register every critical text, logo, CTA, caption, and focal product ref
  // after adding it to the scene. Include a source label such as
  // "scene.tsx:84 heroHeadline", its safe constraint, allowed overlaps, and
  // an optical center target when applicable.
  view.add(<ReviewOverlay registry={review} />);

  // Replace this pause with the authored scene timeline.
  // Keep ReviewOverlay last in the scene tree so audit evidence remains visible.
  yield* waitFor(1);
});
