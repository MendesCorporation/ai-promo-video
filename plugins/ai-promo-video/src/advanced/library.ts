export const motionComponentCategories = [
  'background',
  'layout',
  'typography',
  'product',
  'shape',
  'transition',
  'camera',
  'cursor',
  'particle',
  'effect',
] as const;

export type MotionComponentCategory = typeof motionComponentCategories[number];
export type MotionEnergy = 'quiet' | 'measured' | 'energetic' | 'impact';

export interface MotionComponent {
  id: string;
  title: string;
  category: MotionComponentCategory;
  summary: string;
  tags: string[];
  moods: string[];
  energy: MotionEnergy[];
  sourceExports: string[];
  parameters: string[];
  compositionNotes: string;
}

const component = (
  id: string,
  title: string,
  category: MotionComponentCategory,
  summary: string,
  tags: string[],
  moods: string[],
  energy: MotionEnergy[],
  sourceExports: string[],
  parameters: string[],
  compositionNotes: string,
): MotionComponent => ({ id, title, category, summary, tags, moods, energy, sourceExports, parameters, compositionNotes });

/**
 * A vocabulary, not a template gallery. Entries intentionally describe visual
 * systems that can be combined and rewritten inside one Revideo scene.
 */
export const motionComponentLibrary: MotionComponent[] = [
  component('aurora-field', 'Aurora Field', 'background', 'Layered blurred color fields with independent drift and scale.', ['gradient', 'organic', 'blur', 'depth'], ['dreamy', 'premium', 'emotional'], ['quiet', 'measured'], ['AuroraBackdrop'], ['palette', 'intensity', 'drift'], 'Use asymmetrically; derive colors from the brief instead of retaining sample values.'),
  component('spotlight-stage', 'Spotlight Stage', 'background', 'A focused radial pool of light that creates a visual stage for one message.', ['radial', 'focus', 'vignette', 'hero'], ['cinematic', 'confident', 'minimal'], ['quiet', 'impact'], ['SpotlightBackdrop'], ['color', 'position', 'spread'], 'Move the light with the subject or product focus.'),
  component('perspective-grid', 'Perspective Grid', 'background', 'A receding line field for dimensional product reveals and camera travel.', ['grid', 'perspective', 'depth', 'technology'], ['technical', 'futuristic', 'energetic'], ['measured', 'energetic'], ['PerspectiveGrid'], ['spacing', 'vanishingPoint', 'opacity'], 'Keep contrast low enough that UI and copy remain dominant.'),
  component('orbit-rings', 'Orbit Rings', 'background', 'Concentric rings with independently moving accents and restrained glow.', ['rings', 'orbit', 'signal', 'radar'], ['technical', 'curious', 'premium'], ['quiet', 'measured'], ['OrbitRings'], ['rings', 'radius', 'accent'], 'Crop rings intentionally and vary the center to avoid logo-template repetition.'),
  component('particle-depth', 'Particle Depth Field', 'background', 'Deterministic foreground and background particles with parallax.', ['particles', 'depth', 'dust', 'bokeh'], ['cinematic', 'emotional', 'atmospheric'], ['quiet', 'measured'], ['ParticleField'], ['count', 'seed', 'depth', 'palette'], 'Use a unique seed and tie movement to camera direction.'),
  component('scanline-field', 'Scanline Field', 'background', 'Fine animated scan lines for diagnostic, data, or retro-tech moments.', ['scanlines', 'data', 'texture', 'diagnostic'], ['technical', 'tense', 'retro'], ['measured', 'energetic'], ['ScanlineOverlay'], ['spacing', 'opacity', 'speed'], 'Reserve for short sections; continuous use reduces readability.'),
  component('topographic-flow', 'Topographic Flow', 'background', 'Custom bezier contour lines that slowly deform behind the composition.', ['contour', 'map', 'line', 'organic'], ['thoughtful', 'exploratory', 'premium'], ['quiet', 'measured'], ['RouteTrace'], ['paths', 'lineWidth', 'drift'], 'Author paths for the shot; do not duplicate a fixed contour asset.'),
  component('light-sweep-field', 'Light Sweep Field', 'background', 'One directional light band that crosses layers and motivates a transition.', ['light', 'sweep', 'gradient', 'transition'], ['cinematic', 'launch', 'premium'], ['energetic', 'impact'], ['AuroraBackdrop'], ['direction', 'width', 'color'], 'Align the sweep with the outgoing and incoming motion vectors.'),

  component('editorial-left', 'Editorial Left Stack', 'layout', 'Strong left-aligned copy with controlled negative space for product imagery.', ['editorial', 'copy', 'asymmetric', 'negative-space'], ['confident', 'minimal', 'premium'], ['quiet', 'impact'], ['GlassCard'], ['gutter', 'measure', 'baseline'], 'Calculate text widths and let the product occupy the opposing visual weight.'),
  component('split-proof', 'Split Proof', 'layout', 'Claim on one side and visual evidence on the other, connected by motion.', ['split', 'proof', 'comparison', 'evidence'], ['clear', 'technical', 'confident'], ['measured', 'impact'], ['ProductFrame', 'MetricTile'], ['ratio', 'gutter', 'direction'], 'Let the camera cross the split instead of treating both halves as slides.'),
  component('product-hero-stage', 'Product Hero Stage', 'layout', 'One dominant product surface with supporting microcopy and depth layers.', ['hero', 'product', 'stage', 'depth'], ['premium', 'confident', 'launch'], ['measured', 'impact'], ['ProductFrame', 'SpotlightBackdrop'], ['productScale', 'copyAnchor', 'depth'], 'Build the hierarchy from the actual product screenshot or recorded flow.'),
  component('modular-grid', 'Modular Editorial Grid', 'layout', 'An authored grid of modules that can assemble, rearrange, and collapse.', ['grid', 'modules', 'cards', 'editorial'], ['technical', 'playful', 'organized'], ['measured', 'energetic'], ['GlassCard', 'staggerIn'], ['columns', 'rows', 'gap'], 'Vary module spans and content; avoid four identical cards.'),
  component('floating-islands', 'Floating Islands', 'layout', 'Independent content planes at different depths linked by camera travel.', ['planes', 'parallax', 'depth', 'spatial'], ['futuristic', 'premium', 'playful'], ['measured', 'energetic'], ['GlassCard', 'cameraMove'], ['depths', 'spacing', 'cameraPath'], 'Make one island primary per beat and allow others to leave frame.'),
  component('stacked-depth', 'Stacked Depth', 'layout', 'Layered surfaces that peel forward to reveal successive information.', ['stack', 'layers', 'reveal', 'depth'], ['cinematic', 'technical', 'dramatic'], ['energetic', 'impact'], ['ProductFrame', 'GlassCard'], ['layers', 'separation', 'tilt'], 'Use motivated z-order and never leave text hidden behind a surface.'),
  component('centered-manifesto', 'Centered Manifesto', 'layout', 'A typography-led center composition designed for a single emotional line.', ['manifesto', 'type', 'center', 'statement'], ['emotional', 'bold', 'minimal'], ['quiet', 'impact'], ['impactText'], ['maxWidth', 'lineHeight', 'accent'], 'Use sparingly and transition through the text itself.'),

  component('tracking-reveal', 'Tracking Reveal', 'typography', 'Letters resolve from wide tracking and soft focus into a precise wordmark.', ['tracking', 'blur', 'letters', 'reveal'], ['premium', 'minimal', 'cinematic'], ['quiet', 'impact'], ['trackReveal'], ['tracking', 'blur', 'duration'], 'Measure final glyph bounds before positioning adjacent elements.'),
  component('word-cascade', 'Word Cascade', 'typography', 'Words enter one by one with a configurable vector and stagger.', ['words', 'stagger', 'cascade', 'copy'], ['energetic', 'clear', 'playful'], ['measured', 'energetic'], ['wordCascade'], ['direction', 'stagger', 'distance'], 'Vary cadence with meaning rather than using a fixed equal interval.'),
  component('impact-scale', 'Impact Scale', 'typography', 'A short scale-and-focus hit for the decisive word in a sentence.', ['impact', 'scale', 'focus', 'keyword'], ['bold', 'launch', 'confident'], ['impact'], ['impactText'], ['overshoot', 'blur', 'duration'], 'Apply to one semantic peak, not every line.'),
  component('letter-rise', 'Per-letter Rise', 'typography', 'Individual glyphs rise, settle, and sharpen with controlled overlap.', ['letters', 'rise', 'stagger', 'kinetic'], ['premium', 'playful', 'editorial'], ['measured', 'energetic'], ['letterRise'], ['stagger', 'distance', 'overshoot'], 'Render measured glyph positions; never approximate with manual spaces.'),
  component('gradient-sweep-text', 'Gradient Sweep Text', 'typography', 'A moving multi-stop gradient travels through selected text.', ['gradient', 'type', 'highlight', 'sweep'], ['premium', 'launch', 'playful'], ['measured', 'impact'], ['gradientSweep'], ['stops', 'angle', 'duration'], 'Choose palette from art direction and keep non-highlight text neutral.'),
  component('typewriter-caret', 'Typewriter With Caret', 'typography', 'Text writes with a synchronized caret and optional pause rhythm.', ['typewriter', 'caret', 'writing', 'terminal'], ['technical', 'curious', 'human'], ['quiet', 'measured'], ['typewriter'], ['charactersPerSecond', 'caret', 'pauses'], 'Use proportional text measurement unless the design explicitly calls for monospace.'),
  component('erase-rewrite', 'Erase and Rewrite', 'typography', 'A phrase is erased and replaced without rebuilding the surrounding layout.', ['erase', 'rewrite', 'copy', 'transformation'], ['clever', 'clear', 'transformative'], ['measured', 'impact'], ['eraseAndType'], ['eraseRate', 'writeRate', 'hold'], 'Preserve the text anchor so neighboring copy moves intentionally.'),
  component('directional-swap', 'Directional Phrase Swap', 'typography', 'Outgoing and incoming phrases exchange along one directional flow.', ['swap', 'phrase', 'direction', 'transition'], ['energetic', 'clear', 'modern'], ['energetic', 'impact'], ['swapText'], ['direction', 'distance', 'overlap'], 'Match the vector to camera travel or the next product action.'),
  component('text-push', 'Text Push', 'typography', 'Incoming copy physically displaces existing copy using measured widths.', ['push', 'layout', 'measured', 'kinetic'], ['playful', 'bold', 'editorial'], ['energetic', 'impact'], ['pushText', 'arrangeTextRow'], ['gap', 'direction', 'overshoot'], 'Always calculate final widths; this prevents the unnatural spacing seen in naive compositions.'),
  component('text-mask-wipe', 'Typography Mask Wipe', 'typography', 'Large glyphs become a reveal window for the next visual layer.', ['mask', 'type', 'wipe', 'reveal'], ['cinematic', 'bold', 'editorial'], ['energetic', 'impact'], ['impactText'], ['word', 'scale', 'layer'], 'Author the mask around a short high-contrast word.'),

  component('perspective-product-frame', 'Perspective Product Frame', 'product', 'A product surface with controllable tilt, depth, shadow, and moving camera focus.', ['product', 'perspective', 'screen', 'camera'], ['premium', 'technical', 'launch'], ['measured', 'impact'], ['ProductFrame', 'cameraMove'], ['tiltX', 'tiltY', 'scale', 'focus'], 'Animate camera and surface continuously; do not freeze at one perspective angle.'),
  component('browser-window', 'Browser Window', 'product', 'A neutral browser chrome that wraps screenshots or recorded SaaS footage.', ['browser', 'chrome', 'screen', 'saas'], ['clear', 'technical', 'premium'], ['quiet', 'measured'], ['BrowserFrame'], ['url', 'chromeHeight', 'radius'], 'Restyle chrome to the production system and preserve product fidelity.'),
  component('interface-assembly', 'Interface Assembly', 'product', 'Navigation, content, rows, and controls arrive as separate coordinated layers.', ['ui', 'assembly', 'menu', 'cards'], ['technical', 'satisfying', 'launch'], ['energetic', 'impact'], ['ProductFrame', 'GlassCard', 'staggerIn'], ['groups', 'order', 'stagger'], 'Group by real UI hierarchy; camera should follow the area currently assembling.'),
  component('focus-zoom', 'Product Focus Zoom', 'product', 'Camera locks to a specific control or result while surroundings soften.', ['zoom', 'focus', 'product', 'feature'], ['clear', 'confident', 'technical'], ['measured', 'impact'], ['ProductFrame', 'FocusRing', 'cameraMove'], ['target', 'scale', 'blur'], 'Keep the target inside title-safe bounds throughout the move.'),
  component('cursor-tour', 'Cursor Product Tour', 'product', 'A cursor moves through a real interaction path with clicks and responsive UI states.', ['cursor', 'tour', 'click', 'interaction'], ['clear', 'human', 'technical'], ['measured', 'energetic'], ['CursorGlyph', 'ClickPulse', 'cursorClick'], ['path', 'clicks', 'pace'], 'Use curved routes, acceleration, anticipation, and UI response—never linear robotic motion.'),
  component('metric-proof', 'Metric Proof Tile', 'product', 'A metric tile counts, resolves, and connects the number to visual evidence.', ['metric', 'number', 'proof', 'data'], ['confident', 'clear', 'technical'], ['measured', 'impact'], ['MetricTile'], ['value', 'label', 'accent'], 'Only use defensible claims supplied by the brief.'),
  component('card-stack', 'Card Stack', 'product', 'Cards enter from depth, reorder, and peel away to change focus.', ['cards', 'stack', 'depth', 'reorder'], ['playful', 'premium', 'satisfying'], ['energetic', 'impact'], ['GlassCard', 'staggerIn'], ['count', 'depth', 'spread'], 'Vary card content and silhouette instead of cloning one design.'),

  component('glass-card', 'Glass Surface', 'shape', 'A composable translucent panel with restrained border, blur, and depth.', ['glass', 'panel', 'surface', 'blur'], ['premium', 'futuristic', 'calm'], ['quiet', 'measured'], ['GlassCard'], ['fill', 'stroke', 'blur', 'radius'], 'Adapt opacity to the background and avoid glass everywhere.'),
  component('route-trace', 'Route Trace', 'shape', 'A path draws between anchors and can carry a pulse or label.', ['path', 'trace', 'connection', 'automation'], ['technical', 'curious', 'energetic'], ['measured', 'energetic'], ['RouteTrace'], ['points', 'progress', 'accent'], 'Route around content rather than crossing copy.'),
  component('focus-ring', 'Focus Ring', 'shape', 'A responsive ring or bracket isolates the active product region.', ['focus', 'ring', 'target', 'highlight'], ['clear', 'technical', 'confident'], ['measured', 'impact'], ['FocusRing'], ['size', 'accent', 'pulse'], 'Use one active focus marker at a time.'),
  component('click-pulse', 'Click Pulse', 'shape', 'Concentric click feedback synchronized with a cursor and UI response.', ['click', 'pulse', 'ring', 'feedback'], ['human', 'clear', 'satisfying'], ['energetic', 'impact'], ['ClickPulse'], ['radius', 'accent', 'duration'], 'Place exactly at the interaction coordinate.'),

  component('directional-push', 'Directional Push', 'transition', 'Layers exit and enter on one shared motion vector with depth separation.', ['push', 'direction', 'layers', 'continuity'], ['energetic', 'modern', 'clear'], ['energetic', 'impact'], ['cameraMove'], ['direction', 'overlap', 'depth'], 'Carry at least one object or color relationship across the cut.'),
  component('camera-zoom-through', 'Camera Zoom Through', 'transition', 'Camera moves through a foreground object or UI region into the next scene.', ['camera', 'zoom', 'portal', 'continuity'], ['cinematic', 'launch', 'dramatic'], ['impact'], ['cameraMove'], ['target', 'scale', 'blur'], 'Design the destination frame before choosing the portal.'),
  component('shape-wipe', 'Shape Wipe', 'transition', 'An authored geometric form expands or travels to reveal the next composition.', ['shape', 'wipe', 'mask', 'graphic'], ['playful', 'bold', 'editorial'], ['energetic', 'impact'], ['GlassCard'], ['shape', 'origin', 'easing'], 'Derive the shape from brand or scene content.'),
  component('object-carry', 'Object Carry', 'transition', 'One meaningful object persists across scenes and becomes a new element.', ['object', 'carry', 'match', 'continuity'], ['clever', 'premium', 'narrative'], ['measured', 'impact'], ['cameraMove'], ['object', 'start', 'end'], 'Prefer a product control, keyword, or data point with narrative meaning.'),
  component('blur-cut', 'Directional Blur Cut', 'transition', 'A short directional blur bridges two high-energy poses.', ['blur', 'cut', 'direction', 'speed'], ['energetic', 'cinematic', 'modern'], ['impact'], ['cameraMove'], ['direction', 'strength', 'frames'], 'Keep the blur brief and inspect the transition frame strip.'),
  component('match-scale', 'Match Scale', 'transition', 'An object in the outgoing scene matches the scale and position of the next subject.', ['match', 'scale', 'object', 'continuity'], ['clever', 'cinematic', 'premium'], ['measured', 'impact'], ['cameraMove'], ['fromBounds', 'toBounds', 'duration'], 'Measure both bounds to avoid a visible jump.'),

  component('dolly-in', 'Dolly In', 'camera', 'Continuous forward movement that increases importance without a hard cut.', ['camera', 'dolly', 'zoom', 'focus'], ['cinematic', 'confident', 'emotional'], ['quiet', 'impact'], ['cameraMove'], ['scale', 'target', 'duration'], 'Add subtle lateral drift or depth separation to avoid a digital zoom feel.'),
  component('orbit-sweep', 'Orbit Sweep', 'camera', 'Camera arcs around a product plane while maintaining a clear focal point.', ['camera', 'orbit', 'perspective', 'product'], ['premium', 'futuristic', 'cinematic'], ['measured', 'energetic'], ['cameraMove'], ['arc', 'tilt', 'focus'], 'Use a short arc and keep text layers facing the viewer.'),
  component('focus-track', 'Focus Track', 'camera', 'Camera follows successive interface regions as they assemble or respond.', ['camera', 'follow', 'ui', 'focus'], ['clear', 'technical', 'satisfying'], ['measured', 'energetic'], ['cameraMove'], ['targets', 'holds', 'scale'], 'Move slightly before each UI event so attention arrives first.'),
  component('parallax-pan', 'Parallax Pan', 'camera', 'Layered planes move at different rates during a lateral camera pass.', ['parallax', 'pan', 'layers', 'depth'], ['cinematic', 'premium', 'emotional'], ['quiet', 'measured'], ['cameraMove'], ['direction', 'depths', 'distance'], 'Use three or more depth rates and preserve a stable focal subject.'),
  component('perspective-tilt', 'Perspective Tilt', 'camera', 'Product plane tilt changes during travel to create impact and reveal structure.', ['tilt', 'perspective', 'camera', 'screen'], ['technical', 'launch', 'premium'], ['energetic', 'impact'], ['ProductFrame', 'cameraMove'], ['rotationX', 'rotationY', 'scale'], 'Animate through the angle; never hold one awkward tilt for an entire scene.'),

  component('cursor-bezier', 'Bezier Cursor Path', 'cursor', 'Human-feeling cursor movement with curved travel, acceleration, and landing anticipation.', ['cursor', 'bezier', 'mouse', 'human'], ['clear', 'human', 'technical'], ['measured', 'energetic'], ['CursorGlyph'], ['points', 'duration', 'anticipation'], 'Land before clicking and synchronize the following product response.'),
  component('cursor-drag', 'Cursor Drag', 'cursor', 'Cursor presses, drags an object or value, and releases with visible system response.', ['cursor', 'drag', 'interaction', 'product'], ['clear', 'satisfying', 'technical'], ['energetic'], ['CursorGlyph', 'ClickPulse'], ['from', 'to', 'hold'], 'Make press and release states visually distinct.'),

  component('ambient-dust', 'Ambient Dust', 'particle', 'Slow low-contrast particles that add depth without becoming a subject.', ['particles', 'dust', 'depth', 'ambient'], ['emotional', 'cinematic', 'calm'], ['quiet'], ['ParticleField'], ['count', 'seed', 'opacity'], 'Use deterministic seeds and keep particles away from small copy.'),
  component('signal-particles', 'Signal Particles', 'particle', 'Colored points travel along authored routes and converge on a result.', ['particles', 'signal', 'route', 'data'], ['technical', 'energetic', 'curious'], ['measured', 'energetic'], ['ParticleField', 'RouteTrace'], ['routes', 'count', 'accent'], 'Connect motion to real data flow or narrative logic.'),
  component('constellation-network', 'Constellation Network', 'particle', 'A dynamic network of nodes and restrained connecting lines.', ['network', 'nodes', 'lines', 'system'], ['technical', 'futuristic', 'curious'], ['quiet', 'measured'], ['ParticleField', 'RouteTrace'], ['nodes', 'threshold', 'seed'], 'Limit line density and keep the main hierarchy readable.'),
  component('confetti-burst', 'Confetti Burst', 'particle', 'A short deterministic celebration burst for one earned success beat.', ['confetti', 'celebration', 'burst', 'success'], ['joyful', 'playful', 'launch'], ['impact'], ['ParticleField'], ['origin', 'count', 'palette'], 'Use only when the story earns celebration.'),

  component('bloom-glow', 'Bloom Glow', 'effect', 'Layered soft glow for selected highlights, text, or active controls.', ['bloom', 'glow', 'light', 'highlight'], ['premium', 'cinematic', 'futuristic'], ['quiet', 'impact'], ['AuroraBackdrop'], ['radius', 'intensity', 'color'], 'Apply selectively; uniform glow flattens the hierarchy.'),
  component('chromatic-edge', 'Chromatic Edge', 'effect', 'Brief channel separation around a fast impact or transition.', ['chromatic', 'rgb', 'edge', 'impact'], ['energetic', 'technical', 'bold'], ['impact'], ['ProductFrame'], ['offset', 'duration', 'direction'], 'Use for a few frames and inspect at full resolution.'),
  component('film-grain', 'Film Grain', 'effect', 'Subtle procedural texture that unifies footage and designed layers.', ['grain', 'texture', 'film', 'unify'], ['cinematic', 'emotional', 'premium'], ['quiet', 'measured'], ['ScanlineOverlay'], ['amount', 'size', 'seed'], 'Keep below readability threshold and use a unique deterministic seed.'),
  component('vignette-focus', 'Vignette Focus', 'effect', 'An animated edge falloff that follows the current focal region.', ['vignette', 'focus', 'light', 'camera'], ['cinematic', 'dramatic', 'premium'], ['quiet', 'impact'], ['SpotlightBackdrop'], ['center', 'strength', 'spread'], 'Move center with camera focus; do not leave it centered by default.'),
  component('shadow-depth', 'Shadow Depth', 'effect', 'Animated shadow scale and softness communicate surface distance.', ['shadow', 'depth', 'surface', 'lift'], ['premium', 'satisfying', 'technical'], ['measured'], ['GlassCard', 'ProductFrame'], ['blur', 'offset', 'opacity'], 'Tie shadow change to z movement and scene lighting.'),
];

export interface MotionComponentSearchOptions {
  query?: string;
  categories?: MotionComponentCategory[];
  tags?: string[];
  moods?: string[];
  energy?: MotionEnergy[];
  limit?: number;
}

function normalizedTerms(values: string[]): string[] {
  const stopWords = new Set(['a', 'an', 'and', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);
  return values.flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/)).filter((value) => value && !stopWords.has(value));
}

export function searchMotionComponents(options: MotionComponentSearchOptions = {}): MotionComponent[] {
  const queryTerms = normalizedTerms(options.query ? [options.query] : []);
  const tagTerms = normalizedTerms(options.tags ?? []);
  const moodTerms = normalizedTerms(options.moods ?? []);
  const requestedCategories = new Set(options.categories ?? []);
  const requestedEnergy = new Set(options.energy ?? []);

  const scored = motionComponentLibrary.flatMap((item) => {
    if (requestedCategories.size && !requestedCategories.has(item.category)) return [];
    if (requestedEnergy.size && !item.energy.some((value) => requestedEnergy.has(value))) return [];
    const title = item.title.toLowerCase();
    const id = item.id.toLowerCase();
    const tags = item.tags.map((value) => value.toLowerCase());
    const moods = item.moods.map((value) => value.toLowerCase());
    const haystack = `${id} ${title} ${item.category} ${item.summary} ${tags.join(' ')} ${moods.join(' ')} ${item.compositionNotes}`.toLowerCase();
    if (tagTerms.some((term) => !tags.some((tag) => tag.includes(term)))) return [];
    if (moodTerms.some((term) => !moods.some((mood) => mood.includes(term)))) return [];
    const queryHits = queryTerms.filter((term) => haystack.includes(term)).length;
    if (queryTerms.length && queryHits < Math.max(1, Math.ceil(queryTerms.length * 0.5))) return [];
    let score = 0;
    for (const term of queryTerms) {
      if (id.includes(term)) score += 6;
      if (title.includes(term)) score += 5;
      if (item.category.includes(term)) score += 4;
      if (tags.some((tag) => tag.includes(term))) score += 3;
      if (moods.some((mood) => mood.includes(term))) score += 2;
      if (item.summary.toLowerCase().includes(term)) score += 1;
    }
    return [{ item, score }];
  });

  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100);
  return scored
    .sort((a, b) => b.score - a.score || a.item.category.localeCompare(b.item.category) || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(({ item }) => item);
}

export const motionLibrarySummary = {
  model: 'library-first composition with custom TypeScript escape hatches inside every scene',
  count: motionComponentLibrary.length,
  categories: motionComponentCategories,
  sourceFiles: {
    components: 'motion-library.tsx',
    typography: 'kinetic.ts',
    catalog: 'motion-library.json',
  },
  rule: 'Search by art direction and narrative need. Results are possibilities, never a default template or required visual style.',
};
