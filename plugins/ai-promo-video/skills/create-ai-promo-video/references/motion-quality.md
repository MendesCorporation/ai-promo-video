# Professional Motion Quality Bar

The minimum bar is a strong studio promo, not an automated slideshow. A reference-quality result uses the dimensions relevant to its story—such as typography, depth, camera logic, product surfaces, human footage, interaction, compositing, or intentional sound—with professional control. It does not need every technique. If the supplied reference is stronger, match or exceed its relevant qualities scene by scene.

## Composition and depth

- Give every shot one dominant subject and a clear foreground, midground, and background.
- Protect the outer 5% and keep product details large enough to read at delivery resolution.
- Build depth with scale, parallax, lighting, blur, shadows, masks, particles, or true 3D; flat layers alone rarely meet the bar.
- Use screenshots and recordings as textures inside designed frames, not as unexplained full-screen media.
- Alternate compositions and scale. Repeating centered title plus card layouts reads as a template.
- Reject unexplained repetition from previous productions: the same palette, background motif, card count, camera path, typography entrance, beat order, or transition family is an originality defect when the brief does not justify it.
- For portrait and square output, recompose hierarchy and focal crops; a scaled-down landscape frame is a format defect.

## Motion language

- Establish camera direction and preserve it across adjacent shots when possible.
- Entrances should have anticipation, a fast readable action, and a clean settle.
- Use staggered UI assembly with parent/child logic, then resolve into the real interface.
- A cursor moves with intent, eases into a real target, compresses on click, creates a pulse, and triggers a visible response.
- Perspective screens need consistent vanishing direction, readable texture, edge treatment, and appropriate shadow or light falloff.
- Use motion blur or directional blur for fast travel, but never to hide weak timing.
- Time major transitions to musical phrases or accents, not arbitrary equal intervals.
- Keep camera motion alive through a perspective shot: arrive at a focus, follow the interaction, then reframe or exit. A fixed tilted screen is not a camera move.
- When a shot calls for ambient life, keep its selected background, depth, light, or camera threads continuous beneath semantic events. Reject stop-start drift, abrupt phase changes, visible loop seams, or motion that restarts after each beat. Reject concurrent story and ambient threads that write the same position, scale, rotation, opacity, or gradient signal; separate them with nested rigs.
- Judge continuity inside the declared focal region. Ambient lights or background particles do not compensate for a subject or camera that visibly reaches zero velocity without intention.
- When a path must cross several beats with momentum, author it as one velocity-continuous timeline. Prefer `continuousCameraPath` or `continuousParticlePath` over several independent ease-in/ease-out calls; keep segmented arrivals only when a full stop communicates meaning.

## Product proof

- Capture meaningful actions and outcomes, not login, loading, empty, or setup states.
- Use a focus zoom, mask, label, or crop when the valuable control is small.
- Do not display secrets, private data, unapproved customer names, or invented performance claims.

## Review

Complete `motion-plan.json` before the first render. Declare each logical shot's focal region and subject/background/camera motion, the exact end of every entrance and settle, transition times, velocity bridges, and intentional stillness intervals with reasons. Every non-final shot declares whether its boundary is literal continuous motion, a perceptually motivated cut, or an intentional stop. Run `validate_motion_plan` and repair every exact schema or semantic error before rendering.

Register every critical text, logo, CTA, caption, and focal product ref in the scaffold's review registry. Give each one a stable id, source label, frame/safe/custom constraint, permitted overlaps, and—only when centered by design—a center target, axis, tolerance, and optional optical offset. Decorations should opt out of collision checks. Keep the render-only `ReviewOverlay` last in the scene tree.

Generate a fresh visual review pack after every full render and after every revised range. Pass `projectFile`, `motionPlanPath`, and the same runtime variables as the final render. Inspect `sourceQuality`, then load every exact `evidenceFrames`, declared `settledFrames`, overview sheet, and dense transition strip with `read_visual_files`, plus cursor-down and post-click states. The annotated layout frames contain element ids and source labels; motion-lull frames mark the measured focal region. Treat each detection as a candidate: decide whether it is intentional, document that decision, and correct only material problems. Compare the settled frame against the moving states; expressive tracking, blur, or displacement must not remain accidentally active.

Reject any unexplained render with disconnected word spacing, poor logo lockup gaps, unintended tracking, collisions, orphaned line breaks, clipped text, tiny or soft product UI, broken z-order, flashes between scenes, mismatched camera direction, arbitrary decoration, focal motion that stops while only the background continues, unsafe portrait placement, caption plates appearing long before their words, unreadable caption speed, inaccurate claimed word sync, audio jumps, license ambiguity, or a final CTA/resolution that disappears before it can be understood. Correct material issues and regenerate the pack before delivery.

For optical glass, inspect full-resolution frames over every materially different background region. Reject flat blur pretending to be refraction, doubled or broken glyph edges, unreadable glass type, clipped lens distortion, a glass body that appears before its materialization, or highlights that jump independently from the light and geometry.
