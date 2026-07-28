export const motionComponentCategories = [
  'background',
  'format',
  'layout',
  'caption',
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
  component('continuous-ambient-field', 'Continuous Ambient Field', 'background', 'A background and its gradients keep continuously drifting while the scene plays instead of receiving isolated motion events.', ['ambient', 'continuous', 'continuously', 'drift', 'drifting', 'background', 'scene', 'breathing'], ['cinematic', 'premium', 'atmospheric'], ['quiet', 'measured'], ['ambientDrift', 'ambientGradient', 'runWithAmbientMotion'], ['duration', 'amplitude', 'speed', 'seed', 'settle'], 'Run for the exact visible shot duration in parallel with the authored beat timeline. Keep amplitude subordinate to the subject and never restart it after each event.'),

  component('adaptive-format-stage', 'Adaptive Format Stage', 'format', 'A safe-area-aware stage that recomposes hierarchy across landscape, portrait, and square outputs.', ['responsive', 'vertical', 'portrait', 'square', 'safe-area'], ['clear', 'editorial', 'social'], ['quiet', 'measured', 'energetic', 'impact'], ['AdaptiveStage', 'formatProfile', 'adaptiveValue'], ['format', 'platform', 'safeArea'], 'Recompose the scene at each aspect ratio; never shrink a finished 16:9 layout into 9:16.'),
  component('portrait-product-stage', 'Portrait Product Stage', 'format', 'A tall product surface designed around readable feature crops instead of a tiny desktop screenshot.', ['vertical', 'portrait', 'product', 'crop', 'mobile'], ['clear', 'premium', 'technical'], ['measured', 'impact'], ['PortraitProductStage', 'focalCrop'], ['crop', 'focus', 'scale', 'captionLane'], 'Choose the product detail that proves the beat and let the camera move between focal regions.'),
  component('platform-safe-area', 'Platform Safe Area', 'format', 'Conservative authoring guides for generic vertical, TikTok, Instagram Reels, and YouTube Shorts UI zones.', ['safe-area', 'tiktok', 'reels', 'shorts', 'overlay'], ['clear', 'technical'], ['quiet'], ['SafeAreaOverlay', 'safeAreaBounds'], ['platform', 'insets', 'debug'], 'Treat defaults as editable guides because platform UI can change; remove the overlay before delivery.'),
  component('focal-cover-crop', 'Focal Cover Crop', 'format', 'A cover crop that follows a normalized subject or product focal point while protecting frame edges.', ['crop', 'focal', 'tracking', 'vertical', 'footage'], ['cinematic', 'clear', 'social'], ['measured', 'energetic'], ['focalCrop'], ['sourceSize', 'targetSize', 'focal', 'overscan'], 'Keyframe the focal point when the subject moves; inspect the full path for edge exposure.'),
  component('vertical-split-stack', 'Vertical Split Stack', 'format', 'A portrait layout that balances b-roll, product proof, and caption space in authored stacked regions.', ['vertical', 'split', 'stack', 'b-roll', 'product'], ['editorial', 'clear', 'energetic'], ['measured', 'energetic'], ['AdaptiveStage', 'PortraitProductStage'], ['ratios', 'gap', 'order', 'captionLane'], 'Change region emphasis by beat instead of keeping a permanent equal split.'),

  component('editorial-left', 'Editorial Left Stack', 'layout', 'Strong left-aligned copy with controlled negative space for product imagery.', ['editorial', 'copy', 'asymmetric', 'negative-space'], ['confident', 'minimal', 'premium'], ['quiet', 'impact'], ['GlassCard'], ['gutter', 'measure', 'baseline'], 'Calculate text widths and let the product occupy the opposing visual weight.'),
  component('split-proof', 'Split Proof', 'layout', 'Claim on one side and visual evidence on the other, connected by motion.', ['split', 'proof', 'comparison', 'evidence'], ['clear', 'technical', 'confident'], ['measured', 'impact'], ['ProductFrame', 'MetricTile'], ['ratio', 'gutter', 'direction'], 'Let the camera cross the split instead of treating both halves as slides.'),
  component('product-hero-stage', 'Product Hero Stage', 'layout', 'One dominant product surface with supporting microcopy and depth layers.', ['hero', 'product', 'stage', 'depth'], ['premium', 'confident', 'launch'], ['measured', 'impact'], ['ProductFrame', 'SpotlightBackdrop'], ['productScale', 'copyAnchor', 'depth'], 'Build the hierarchy from the actual product screenshot or recorded flow.'),
  component('modular-grid', 'Modular Editorial Grid', 'layout', 'An authored grid of modules that can assemble, rearrange, and collapse.', ['grid', 'modules', 'cards', 'editorial'], ['technical', 'playful', 'organized'], ['measured', 'energetic'], ['GlassCard', 'staggerIn'], ['columns', 'rows', 'gap'], 'Vary module spans and content; avoid four identical cards.'),
  component('floating-islands', 'Floating Islands', 'layout', 'Independent content planes at different depths linked by camera travel.', ['planes', 'parallax', 'depth', 'spatial'], ['futuristic', 'premium', 'playful'], ['measured', 'energetic'], ['GlassCard', 'cameraMove'], ['depths', 'spacing', 'cameraPath'], 'Make one island primary per beat and allow others to leave frame.'),
  component('stacked-depth', 'Stacked Depth', 'layout', 'Layered surfaces that peel forward to reveal successive information.', ['stack', 'layers', 'reveal', 'depth'], ['cinematic', 'technical', 'dramatic'], ['energetic', 'impact'], ['ProductFrame', 'GlassCard'], ['layers', 'separation', 'tilt'], 'Use motivated z-order and never leave text hidden behind a surface.'),
  component('centered-manifesto', 'Centered Manifesto', 'layout', 'A typography-led center composition designed for a single emotional line.', ['manifesto', 'type', 'center', 'statement'], ['emotional', 'bold', 'minimal'], ['quiet', 'impact'], ['impactText'], ['maxWidth', 'lineHeight', 'accent'], 'Use sparingly and transition through the text itself.'),

  component('word-follow-caption', 'Word Follow Caption', 'caption', 'Measured words remain readable while the spoken word lifts, scales, and changes color.', ['caption', 'subtitle', 'word', 'speech', 'vertical'], ['clear', 'human', 'social'], ['measured', 'energetic'], ['CaptionLane', 'playWordFollowCaption'], ['wordTimings', 'activeColor', 'scale', 'lift'], 'Use exact word timestamps when available; label cue interpolation as approximate.'),
  component('karaoke-fill-caption', 'Karaoke Fill Caption', 'caption', 'Completed and current words receive progressive emphasis while future words remain subdued.', ['caption', 'karaoke', 'fill', 'speech', 'subtitle'], ['clear', 'energetic', 'social'], ['measured', 'energetic'], ['CaptionLane', 'playKaraokeCaption'], ['wordTimings', 'activeColor', 'inactiveOpacity'], 'Keep completed words legible and avoid decorative color changes unrelated to speech.'),
  component('punch-caption', 'Semantic Punch Caption', 'caption', 'Selected semantic words receive a stronger timed hit without making every word shout.', ['caption', 'impact', 'semantic', 'keyword', 'speech'], ['bold', 'social', 'confident'], ['energetic', 'impact'], ['CaptionLane', 'playPunchCaption'], ['emphasis', 'activeScale', 'activeLift'], 'Mark emphasis from meaning and delivery, not at a fixed cadence.'),
  component('stacked-phrase-caption', 'Stacked Phrase Caption', 'caption', 'Short phrase groups replace one another with stable two-line geometry and controlled reflow.', ['caption', 'phrase', 'stack', 'reflow', 'subtitle'], ['editorial', 'clear', 'human'], ['measured', 'energetic'], ['CaptionLane', 'pushText'], ['phrases', 'lineLimit', 'transition'], 'Split on semantic boundaries and hold each settled phrase long enough to read.'),
  component('caption-push', 'Caption Push', 'caption', 'Incoming measured words physically displace preceding words while preserving optical gaps.', ['caption', 'push', 'measured', 'kinetic', 'word'], ['playful', 'bold', 'social'], ['energetic', 'impact'], ['CaptionLane', 'arrangeTextRow', 'pushText'], ['gap', 'direction', 'overshoot'], 'Recalculate row widths after every copy change; never fake spacing with manual x positions.'),
  component('caption-window', 'Caption Context Window', 'caption', 'The active phrase is dominant while previous and next context remain spatially available.', ['caption', 'context', 'window', 'speech', 'accessibility'], ['clear', 'human', 'editorial'], ['quiet', 'measured'], ['CaptionLane'], ['previous', 'active', 'next', 'opacity'], 'Keep context secondary and prevent more than one phrase from competing for focus.'),
  component('speaker-caption', 'Speaker Caption', 'caption', 'A kinetic caption lane with restrained speaker identity for interviews or alternating voices.', ['caption', 'speaker', 'dialogue', 'identity', 'subtitle'], ['human', 'clear', 'editorial'], ['quiet', 'measured'], ['CaptionLane'], ['speaker', 'speakerColor', 'position'], 'Use speaker labels only when they add necessary clarity.'),
  component('adaptive-caption-lane', 'Adaptive Caption Lane', 'caption', 'A movable caption region that respects platform controls, product hotspots, and current focal content.', ['caption', 'safe-area', 'vertical', 'collision', 'layout'], ['clear', 'technical', 'social'], ['quiet', 'measured'], ['captionLaneY', 'safeAreaBounds', 'CaptionLane'], ['safeArea', 'hotspots', 'laneHeight', 'margin'], 'Author lane changes at shot boundaries and verify every settled frame for collisions.'),

  component('tracking-reveal', 'Tracking Reveal', 'typography', 'Letters resolve from wide tracking and soft focus into a precise wordmark without flashing their settled state first.', ['tracking', 'blur', 'letters', 'reveal'], ['premium', 'minimal', 'cinematic'], ['quiet', 'impact'], ['prepareTrackReveal', 'playTrackReveal', 'trackReveal'], ['tracking', 'blur', 'duration'], 'For a delayed reveal, prepare the hidden state before any parent layer becomes visible, then play it at the authored cue. Measure final glyph bounds before positioning adjacent elements.'),
  component('word-cascade', 'Word Cascade', 'typography', 'Words enter one by one with a configurable vector and stagger.', ['words', 'stagger', 'cascade', 'copy'], ['energetic', 'clear', 'playful'], ['measured', 'energetic'], ['wordCascade'], ['direction', 'stagger', 'distance'], 'Vary cadence with meaning rather than using a fixed equal interval.'),
  component('impact-scale', 'Impact Scale', 'typography', 'A short scale-and-focus hit for the decisive word in a sentence.', ['impact', 'scale', 'focus', 'keyword'], ['bold', 'launch', 'confident'], ['impact'], ['impactText'], ['overshoot', 'blur', 'duration'], 'Apply to one semantic peak, not every line.'),
  component('letter-rise', 'Per-letter Rise', 'typography', 'Individual glyphs rise, settle, and sharpen with controlled overlap.', ['letters', 'rise', 'stagger', 'kinetic'], ['premium', 'playful', 'editorial'], ['measured', 'energetic'], ['letterRise'], ['stagger', 'distance', 'overshoot'], 'Render measured glyph positions; never approximate with manual spaces.'),
  component('gradient-sweep-text', 'Gradient Sweep Text', 'typography', 'A moving multi-stop gradient travels through selected text.', ['gradient', 'type', 'highlight', 'sweep'], ['premium', 'launch', 'playful'], ['measured', 'impact'], ['gradientSweep'], ['stops', 'angle', 'duration'], 'Choose palette from art direction and keep non-highlight text neutral.'),
  component('specular-text-sweep', 'Specular Text Sweep', 'typography', 'A broad reflection and crisp light core cross settled glyphs without replacing their base fill.', ['specular', 'light', 'sheen', 'shine', 'text', 'sweep'], ['premium', 'cinematic', 'polished'], ['measured', 'impact'], ['SpecularTextStack', 'specularTextSweep'], ['angle', 'direction', 'travel', 'span', 'softColor', 'coreColor', 'width', 'glow', 'duration'], 'Create the aligned base and hidden light layers with SpecularTextStack during scene setup, then play the sweep on a settled emphasis or logo moment. This avoids first-frame font relayout; do not repeat it on every line.'),
  component('liquid-glass-text', 'Liquid Glass Text', 'typography', 'Large glyphs become live optical lenses with edge normals, refraction, chromatic dispersion, liquid materialization, moving highlights, and luminance-aware contrast.', ['liquid-glass', 'glass', 'text', 'glyph', 'refraction', 'lens', 'shader'], ['premium', 'tactile', 'cinematic'], ['measured', 'impact'], ['LiquidGlassText'], ['text', 'fontFamily', 'fontSize', 'fontWeight', 'refraction', 'dispersion', 'thickness', 'reveal', 'lightAngle', 'phase', 'sweep', 'tint'], 'Import from liquid-glass-text.tsx. Use for one short, large, heavy word or logo over a structured moving background. Keep captions, paragraphs, and thin type on conventional high-contrast rendering.'),
  component('typewriter-caret', 'Typewriter With Caret', 'typography', 'Text writes with a synchronized caret and optional pause rhythm.', ['typewriter', 'caret', 'writing', 'terminal'], ['technical', 'curious', 'human'], ['quiet', 'measured'], ['typewriter'], ['charactersPerSecond', 'caret', 'pauses'], 'Use proportional text measurement unless the design explicitly calls for monospace.'),
  component('erase-rewrite', 'Erase and Rewrite', 'typography', 'A phrase is erased and replaced without rebuilding the surrounding layout.', ['erase', 'rewrite', 'copy', 'transformation'], ['clever', 'clear', 'transformative'], ['measured', 'impact'], ['eraseAndType'], ['eraseRate', 'writeRate', 'hold'], 'Preserve the text anchor so neighboring copy moves intentionally.'),
  component('directional-swap', 'Directional Phrase Swap', 'typography', 'Outgoing and incoming phrases exchange along one directional flow.', ['swap', 'phrase', 'direction', 'transition'], ['energetic', 'clear', 'modern'], ['energetic', 'impact'], ['swapText'], ['direction', 'distance', 'overlap'], 'Match the vector to camera travel or the next product action.'),
  component('text-push', 'Text Push', 'typography', 'Incoming copy physically displaces existing copy using measured widths.', ['push', 'layout', 'measured', 'kinetic'], ['playful', 'bold', 'editorial'], ['energetic', 'impact'], ['pushText', 'arrangeTextRow'], ['gap', 'direction', 'overshoot'], 'Always calculate final widths; this prevents the unnatural spacing seen in naive compositions.'),
  component('text-mask-wipe', 'Typography Mask Wipe', 'typography', 'Large glyphs become a reveal window for the next visual layer.', ['mask', 'type', 'wipe', 'reveal'], ['cinematic', 'bold', 'editorial'], ['energetic', 'impact'], ['impactText'], ['word', 'scale', 'layer'], 'Author the mask around a short high-contrast word.'),
  component('glyph-outline-draw', 'Glyph Outline Draw', 'typography', 'Licensed font glyphs become vector paths whose contours draw, fill, or fragment independently.', ['glyph', 'outline', 'vector', 'font', 'draw'], ['premium', 'editorial', 'cinematic'], ['quiet', 'measured', 'impact'], ['textToGlyphPaths', 'drawGlyphOutlines'], ['fontBuffer', 'fontSize', 'stroke', 'stagger'], 'Load a licensed font asset and verify kerning and the final filled word after the outline motion.'),
  component('vector-shape-morph', 'Vector Shape Morph', 'typography', 'A glyph, logo, or arbitrary SVG path smoothly changes topology into another authored form.', ['morph', 'svg', 'glyph', 'logo', 'shape'], ['clever', 'premium', 'transformative'], ['measured', 'impact'], ['morphVectorPath'], ['fromPath', 'toPath', 'segmentLength', 'duration'], 'Use meaningful source and destination silhouettes and inspect intermediate self-intersections.'),
  component('text-on-path', 'Text On Path', 'typography', 'Glyphs follow an authored curve with calculated positions and tangent rotation.', ['text', 'path', 'curve', 'glyph', 'editorial'], ['playful', 'premium', 'exploratory'], ['quiet', 'measured', 'energetic'], ['textOnPolyline'], ['points', 'offset', 'glyphCount'], 'Keep tangent rotation readable and avoid overly tight curves.'),
  component('particle-text-rebuild', 'Particle Text Rebuild', 'typography', 'A word or short line dissolves into particles or reassembles from authored glyph targets.', ['text', 'particles', 'dissolve', 'rebuild', 'glyph'], ['cinematic', 'dramatic', 'launch'], ['energetic', 'impact'], ['AttractorParticles', 'attractParticles', 'dissolveParticles'], ['targets', 'seed', 'stagger', 'vectors'], 'Sample targets from the actual final glyph geometry and keep the settled word stable.'),

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

  component('directional-push', 'Directional Push', 'transition', 'Layers exit and enter on one shared motion vector with configurable overlap, overshoot, and depth separation.', ['push', 'direction', 'layers', 'continuity'], ['energetic', 'modern', 'clear'], ['energetic', 'impact'], ['directionalPush'], ['direction', 'distance', 'overlap', 'depth', 'incomingOvershoot'], 'Import from transitions.ts. Carry at least one object or color relationship across the cut; customize or replace the rig whenever the story needs a different bridge.'),
  component('camera-zoom-through', 'Camera Zoom Through', 'transition', 'Camera travels through an authored focal portal with live blur and a controlled destination resolve.', ['camera', 'zoom', 'portal', 'continuity'], ['cinematic', 'launch', 'dramatic'], ['impact'], ['zoomThrough'], ['target', 'zoom', 'blur', 'incomingScale', 'overlap', 'roll'], 'Import from transitions.ts. Design the destination frame before choosing the portal and author a custom shader/3D path when the shot calls for more than this 2.5D rig.'),
  component('shape-wipe', 'Shape Wipe', 'transition', 'Any caller-authored geometric node grows to cover the cut, swaps the scenes under cover, and clears with controllable rotation.', ['shape', 'wipe', 'mask', 'graphic'], ['playful', 'bold', 'editorial'], ['energetic', 'impact'], ['shapeWipe'], ['origin', 'coverScale', 'rotation', 'incomingScale'], 'Import from transitions.ts. Derive the actual shape, color, silhouette, and path from the brand or scene content.'),
  component('object-carry', 'Object Carry', 'transition', 'One meaningful object follows a configurable curved bridge and changes scale/rotation while scenes exchange.', ['object', 'carry', 'match', 'continuity'], ['clever', 'premium', 'narrative'], ['measured', 'impact'], ['objectCarry'], ['end', 'control', 'endScale', 'endRotation', 'sceneOverlap'], 'Import from transitions.ts. Prefer a product control, keyword, or data point with narrative meaning.'),
  component('blur-cut', 'Directional Blur Cut', 'transition', 'A short vector cut uses animated Revideo blur, travel, overlap, and optional authored echo clones.', ['blur', 'cut', 'direction', 'speed'], ['energetic', 'cinematic', 'modern'], ['impact'], ['directionalBlurCut'], ['direction', 'distance', 'blur', 'overlap', 'echoDistance'], 'Import from transitions.ts. Keep the blur brief and inspect the transition strip at full resolution.'),
  component('match-scale', 'Match Scale', 'transition', 'A caller-authored bridge clone transforms between measured source and destination bounds without a visible jump.', ['match', 'scale', 'object', 'continuity'], ['clever', 'cinematic', 'premium'], ['measured', 'impact'], ['matchScale'], ['fromBounds', 'toBounds', 'endRotation', 'overlap'], 'Import from transitions.ts. Measure both bounds from the actual designed poses; never guess their geometry.'),
  component('organic-morph-wipe', 'Organic Morph Wipe', 'transition', 'An authored SVG path morphs, expands to full-frame cover, swaps scenes, and clears.', ['organic', 'morph', 'wipe', 'svg', 'mask'], ['playful', 'cinematic', 'premium'], ['energetic', 'impact'], ['organicMorphWipe'], ['fromPath', 'toPath', 'coverScale', 'rotation', 'maxSegmentLength'], 'Import from transitions.ts. Derive both silhouettes and direction from scene content rather than using a generic blob.'),
  component('shared-element-bridge', 'Shared Element Bridge', 'transition', 'A product control, card, keyword, or image clone follows a configurable z-arc between measured bounds.', ['shared-element', 'object', 'continuity', 'match', 'transition'], ['clever', 'premium', 'narrative'], ['measured', 'impact'], ['sharedElementBridge'], ['fromBounds', 'toBounds', 'arcDepth', 'arcDirection', 'endRotation', 'overlap'], 'Import from transitions.ts. Use one narratively meaningful object and match its real bounds on both sides.'),
  component('whip-pan-bridge', 'Whip Pan Bridge', 'transition', 'A fast shared vector carries both scenes through live blur, directional travel, overshoot, and a readable settle.', ['whip', 'pan', 'camera', 'blur', 'speed'], ['cinematic', 'energetic', 'bold'], ['impact'], ['whipPanBridge'], ['direction', 'distance', 'blur', 'overshoot', 'settle'], 'Import from transitions.ts. Preserve travel direction and inspect both the blur peak and first settled destination frame.'),
  component('displacement-reveal', 'Displacement Reveal', 'transition', 'Caller-authored clipped strips exchange in a deterministic noise order with controllable offset, softness, and stagger.', ['displacement', 'noise', 'luma', 'wipe', 'procedural'], ['cinematic', 'organic', 'technical'], ['energetic', 'impact'], ['displacementReveal'], ['direction', 'distance', 'softness', 'stagger', 'seed'], 'Import from transitions.ts. Build strips from the actual scenes, use a unique deterministic seed, and keep important text away from the unstable edge.'),

  component('dolly-in', 'Dolly In', 'camera', 'A curved forward camera path resolves on an authored focal coordinate with drift, roll, and zoom.', ['camera', 'dolly', 'zoom', 'focus'], ['cinematic', 'confident', 'emotional'], ['quiet', 'impact'], ['dollyIn'], ['target', 'scale', 'drift', 'roll', 'arc', 'duration'], 'Import from camera.ts. Customize the curve and focal coordinate; use Three.js for a physically accurate 3D dolly when required.'),
  component('ambient-camera-rig', 'Ambient Camera Rig', 'camera', 'Low-frequency travel, zoom breathing, and roll keep the camera alive beneath larger authored moves.', ['ambient', 'camera', 'continuous', 'dolly', 'drift'], ['cinematic', 'premium', 'alive'], ['quiet', 'measured'], ['ambientCameraRig', 'runWithAmbientMotion'], ['duration', 'travel', 'zoom', 'roll', 'speed', 'seed'], 'Import from camera.ts. Run concurrently for the full shot, keep overscan, and use a unique seed and amplitude.'),
  component('ambient-parallax-rig', 'Ambient Parallax Rig', 'camera', 'Foreground, subject, and background layers share one continuous motion field at authored depth factors.', ['ambient', 'parallax', 'depth', 'continuous', 'layers'], ['cinematic', 'spatial', 'premium'], ['quiet', 'measured'], ['ambientParallaxRig', 'runWithAmbientMotion'], ['refs', 'depths', 'travel', 'scaleAmplitude', 'speed', 'seed'], 'Import from camera.ts. Assign depths by hierarchy, protect frame edges, and keep the focal subject most stable.'),
  component('orbit-sweep', 'Orbit Sweep', 'camera', 'A 2.5D world rig arcs around a focal point while counter-shaping an optional product plane.', ['camera', 'orbit', 'perspective', 'product'], ['premium', 'futuristic', 'cinematic'], ['measured', 'energetic'], ['orbitSweep'], ['focus', 'arcDegrees', 'radius', 'zoom', 'roll', 'planeTilt', 'planeRef'], 'Import from camera.ts. Use a short authored arc and keep reader-facing copy stable; use Three.js for true spatial orbiting.'),
  component('focus-track', 'Focus Track', 'camera', 'Camera follows an authored sequence of interface targets on continuous curved paths with anticipation, framing, scale, duration, holds, and optional safe bounds.', ['camera', 'follow', 'ui', 'focus'], ['clear', 'technical', 'satisfying'], ['measured', 'energetic'], ['focusTrack'], ['targets', 'defaultDuration', 'defaultScale', 'anticipationDistance', 'positionBounds', 'scaleBounds'], 'Import from camera.ts. Optional bounds protect framing; omit them intentionally when the shot should crop aggressively. Anticipation is a continuous curve, never a teleport.'),
  component('parallax-pan', 'Parallax Pan', 'camera', 'Multiple authored planes travel at explicit depth rates with a more stable focal subject.', ['parallax', 'pan', 'layers', 'depth'], ['cinematic', 'premium', 'emotional'], ['quiet', 'measured'], ['parallaxPan'], ['direction', 'distance', 'depths', 'zoom', 'subjectIndex'], 'Import from camera.ts. Use two or more meaningful depth layers, preferably three, and preserve overscan.'),
  component('perspective-tilt', 'Perspective Tilt', 'camera', 'A product plane animates through skew, nonuniform scale, rotation, position, and resolving blur instead of holding one angle.', ['tilt', 'perspective', 'camera', 'screen'], ['technical', 'launch', 'premium'], ['energetic', 'impact'], ['perspectiveTilt'], ['fromSkew', 'toSkew', 'fromRotation', 'toRotation', 'fromScale', 'toScale', 'position', 'blur'], 'Import from camera.ts. This is a controllable 2.5D rig; use custom Three.js geometry for true perspective.'),
  component('continuous-camera-path', 'Continuous Camera Path', 'camera', 'One velocity-preserving Hermite timeline carries the camera through multiple authored beats without easing to zero at each intermediate point.', ['camera', 'continuous', 'velocity', 'momentum', 'path'], ['cinematic', 'premium', 'alive'], ['quiet', 'measured', 'energetic'], ['continuousCameraPath'], ['keyframes', 'position', 'scale', 'rotation', 'duration'], 'Import from camera.ts when the camera must preserve momentum across beats. Use segmented cameraPath only when full stops are part of the direction.'),

  component('cursor-bezier', 'Bezier Cursor Path', 'cursor', 'Human-feeling cursor movement with curved travel, acceleration, and landing anticipation.', ['cursor', 'bezier', 'mouse', 'human'], ['clear', 'human', 'technical'], ['measured', 'energetic'], ['CursorGlyph'], ['points', 'duration', 'anticipation'], 'Land before clicking and synchronize the following product response.'),
  component('cursor-drag', 'Cursor Drag', 'cursor', 'Cursor presses, drags an object or value, and releases with visible system response.', ['cursor', 'drag', 'interaction', 'product'], ['clear', 'satisfying', 'technical'], ['energetic'], ['CursorGlyph', 'ClickPulse'], ['from', 'to', 'hold'], 'Make press and release states visually distinct.'),

  component('ambient-dust', 'Ambient Dust', 'particle', 'Slow low-contrast particles that add depth without becoming a subject.', ['particles', 'dust', 'depth', 'ambient'], ['emotional', 'cinematic', 'calm'], ['quiet'], ['ParticleField'], ['count', 'seed', 'opacity'], 'Use deterministic seeds and keep particles away from small copy.'),
  component('signal-particles', 'Signal Particles', 'particle', 'Colored points travel along authored routes and converge on a result.', ['particles', 'signal', 'route', 'data'], ['technical', 'energetic', 'curious'], ['measured', 'energetic'], ['ParticleField', 'RouteTrace'], ['routes', 'count', 'accent'], 'Connect motion to real data flow or narrative logic.'),
  component('constellation-network', 'Constellation Network', 'particle', 'A dynamic network of nodes and restrained connecting lines.', ['network', 'nodes', 'lines', 'system'], ['technical', 'futuristic', 'curious'], ['quiet', 'measured'], ['ParticleField', 'RouteTrace'], ['nodes', 'threshold', 'seed'], 'Limit line density and keep the main hierarchy readable.'),
  component('confetti-burst', 'Confetti Burst', 'particle', 'A short deterministic celebration burst for one earned success beat.', ['confetti', 'celebration', 'burst', 'success'], ['joyful', 'playful', 'launch'], ['impact'], ['ParticleField'], ['origin', 'count', 'palette'], 'Use only when the story earns celebration.'),
  component('flow-field', 'Procedural Flow Field', 'particle', 'Seeded simplex-noise paths create coherent atmospheric currents and reveal vectors.', ['flow', 'noise', 'procedural', 'lines', 'particles'], ['organic', 'cinematic', 'exploratory'], ['quiet', 'measured', 'energetic'], ['FlowField'], ['seed', 'noiseScale', 'steps', 'stepLength'], 'Choose a unique deterministic seed and align the flow with camera or narrative direction.'),
  component('particle-attractor', 'Particle Attractor', 'particle', 'Particles converge on authored points such as a logo, glyph contour, product node, or cursor target.', ['particles', 'attractor', 'converge', 'logo', 'text'], ['cinematic', 'technical', 'satisfying'], ['measured', 'energetic', 'impact'], ['AttractorParticles', 'attractParticles'], ['targets', 'seed', 'stagger', 'duration'], 'Let target geometry carry meaning and preserve a readable settle before dispersal.'),
  component('continuous-particle-path', 'Continuous Particle Path', 'particle', 'Particles traverse several authored formations in one velocity-continuous timeline instead of stopping and restarting at every beat.', ['particles', 'continuous', 'velocity', 'formation', 'path'], ['cinematic', 'organic', 'alive'], ['quiet', 'measured', 'energetic'], ['continuousParticlePath'], ['refs', 'targetsByBeat', 'duration', 'durations'], 'Import from procedural.tsx. Preserve particle order across target formations and use segmented attraction only when the stop is intentional.'),
  component('particle-dissolve', 'Particle Dissolve', 'particle', 'Authored nodes scatter along controlled vectors with opacity and scale decay.', ['particles', 'dissolve', 'scatter', 'transition', 'trail'], ['cinematic', 'dramatic', 'energetic'], ['energetic', 'impact'], ['dissolveParticles'], ['vectors', 'stagger', 'duration'], 'Use direction and speed that continue the scene motion instead of random explosion.'),
  component('shockwave-ring', 'Shockwave Ring', 'particle', 'A brief expanding wave marks a click, impact, logo resolve, or earned reveal.', ['shockwave', 'ring', 'impact', 'click', 'reveal'], ['bold', 'cinematic', 'satisfying'], ['impact'], ['Shockwave', 'shockwave'], ['origin', 'scale', 'duration', 'color'], 'Synchronize with a visible cause and keep it shorter than the viewer attention reset.'),

  component('bloom-glow', 'Bloom Glow', 'effect', 'Layered soft glow for selected highlights, text, or active controls.', ['bloom', 'glow', 'light', 'highlight'], ['premium', 'cinematic', 'futuristic'], ['quiet', 'impact'], ['AuroraBackdrop'], ['radius', 'intensity', 'color'], 'Apply selectively; uniform glow flattens the hierarchy.'),
  component('chromatic-edge', 'Chromatic Edge', 'effect', 'Brief channel separation around a fast impact or transition.', ['chromatic', 'rgb', 'edge', 'impact'], ['energetic', 'technical', 'bold'], ['impact'], ['ProductFrame'], ['offset', 'duration', 'direction'], 'Use for a few frames and inspect at full resolution.'),
  component('film-grain', 'Film Grain', 'effect', 'Subtle procedural texture that unifies footage and designed layers.', ['grain', 'texture', 'film', 'unify'], ['cinematic', 'emotional', 'premium'], ['quiet', 'measured'], ['ScanlineOverlay'], ['amount', 'size', 'seed'], 'Keep below readability threshold and use a unique deterministic seed.'),
  component('vignette-focus', 'Vignette Focus', 'effect', 'An animated edge falloff that follows the current focal region.', ['vignette', 'focus', 'light', 'camera'], ['cinematic', 'dramatic', 'premium'], ['quiet', 'impact'], ['SpotlightBackdrop'], ['center', 'strength', 'spread'], 'Move center with camera focus; do not leave it centered by default.'),
  component('shadow-depth', 'Shadow Depth', 'effect', 'Animated shadow scale and softness communicate surface distance.', ['shadow', 'depth', 'surface', 'lift'], ['premium', 'satisfying', 'technical'], ['measured'], ['GlassCard', 'ProductFrame'], ['blur', 'offset', 'opacity'], 'Tie shadow change to z movement and scene lighting.'),
  component('optical-liquid-glass', 'Optical Liquid Glass', 'effect', 'A neutral rounded optical surface that refracts already-rendered layers with edge lensing, chromatic dispersion, adaptive tint, and responsive highlights.', ['liquid-glass', 'optical', 'refraction', 'lens', 'surface', 'shader'], ['premium', 'tactile', 'cinematic'], ['quiet', 'measured', 'impact'], ['OpticalGlass'], ['width', 'height', 'radius', 'bevel', 'refraction', 'dispersion', 'reveal', 'lightAngle', 'interaction', 'phase', 'touchPoint', 'tint'], 'Import from optical-glass.tsx and author the shape, content, palette, and choreography for the current shot. Use sparingly over a moving or structured background so the refraction has visible information to bend.'),
  component('ambient-orbit-motion', 'Ambient Orbit Motion', 'effect', 'Decorative geometry follows a smooth elliptical path and optionally rotates for the full shot.', ['ambient', 'orbit', 'continuous', 'geometry', 'decoration'], ['playful', 'technical', 'atmospheric'], ['quiet', 'measured'], ['ambientOrbit', 'runWithAmbientMotion'], ['duration', 'radius', 'speed', 'rotationSpeed', 'direction', 'seed'], 'Use on secondary geometry only; primary copy and controls should not orbit decoratively.'),
  component('ambient-light-pulse', 'Ambient Light Pulse', 'effect', 'A light or emphasis layer breathes in scale and opacity without a visible start jump.', ['ambient', 'light', 'pulse', 'breathing', 'continuous'], ['cinematic', 'emotional', 'premium'], ['quiet', 'measured'], ['ambientPulse', 'runWithAmbientMotion'], ['duration', 'scaleAmplitude', 'opacityAmplitude', 'speed', 'phase'], 'Keep contrast changes below readability thresholds and run the pulse concurrently with scene action.'),
  component('selective-bloom-stack', 'Selective Bloom Stack', 'effect', 'A Three.js post-processing stack blooms only authored highlights above a luminance threshold.', ['bloom', 'postprocessing', 'three', 'light', 'selective'], ['premium', 'cinematic', 'futuristic'], ['quiet', 'impact'], ['createPostProcessing'], ['intensity', 'threshold'], 'Protect text edges and do not bloom the entire frame uniformly.'),
  component('depth-of-field-stack', 'Depth of Field Stack', 'effect', 'Camera-linked depth of field separates foreground, subject, and background in a true 3D scene.', ['depth-of-field', 'bokeh', 'focus', 'three', 'postprocessing'], ['cinematic', 'premium', 'dramatic'], ['quiet', 'measured', 'impact'], ['createPostProcessing'], ['focusDistance', 'focalLength', 'bokehScale'], 'Rack focus toward a narrative target and inspect product readability throughout.'),
  component('finishing-stack', 'Cinematic Finishing Stack', 'effect', 'Optional vignette, grain, chromatic offset, bloom, and depth of field composed as one controlled pass.', ['postprocessing', 'grain', 'vignette', 'chromatic', 'finish'], ['cinematic', 'premium', 'bold'], ['quiet', 'measured', 'impact'], ['createPostProcessing'], ['bloom', 'depthOfField', 'chromaticAberration', 'grain', 'vignette'], 'Enable only effects justified by the shot; the stack has no implicit look.'),
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
    paint: 'paint.ts',
    sceneTree: 'scene-tree.ts',
    typography: 'kinetic.ts',
    captions: 'captions.tsx',
    formats: 'format.tsx',
    procedural: 'procedural.tsx',
    ambient: 'ambient.ts',
    transitions: 'transitions.ts',
    camera: 'camera.ts',
    vectorMotion: 'vector-motion.ts',
    threeEffects: 'three-effects.ts',
    opticalGlass: 'optical-glass.tsx',
    opticalGlassShader: 'optical-glass.glsl',
    liquidGlassText: 'liquid-glass-text.tsx',
    liquidGlassTextShader: 'liquid-glass-text.glsl',
    review: 'review.tsx',
    motionPlan: 'motion-plan.json',
    catalog: 'ai-promo://motion-library',
  },
  rule: 'Search by art direction and narrative need. Results are possibilities, never a default template or required visual style. Add only selected editable source groups with add_advanced_video_helpers.',
};
