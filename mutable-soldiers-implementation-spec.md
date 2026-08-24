# Mutable Soldiers Landing Page — Implementation Specification v2

## 1. Objective

Build a desktop AAA-quality landing page to promote **Mutable Soldiers**, the mutable NFT collection for the **ARMY** token on the XRP Ledger.

The experience must feel like a single cinematic storytelling sequence controlled by scroll. It is not a succession of independent pages or content blocks: it is a persistent fullscreen scene that changes state through coordinated Three.js animation, video, UI, and transitions.

This project is an independent sandbox, but its implementation must be portable to the production frontend, which uses Next.js 14, TypeScript, and Tailwind CSS. It must not depend on the backend, Zustand, TanStack Query, or the XRPL SDKs unless a future feature explicitly requires them.

## 2. Source of Truth and Scope

Use each source only for the decisions it owns:

- **Scope exclusions in this document** override anything visible or described elsewhere.
- **Figma** is the visual and narrative source of truth: composition, visual states, state order, placement, copy, and intended transitions.
- **Project assets** are the media and technical source of truth: actual filenames, formats, dimensions, duration, codecs, alpha, model contents, and other implementation constraints.
- **This document** is the implementation and architecture source of truth: system ownership, runtime behavior, loading, performance, responsiveness, cleanup, and acceptance criteria.

If sources disagree, resolve the decision according to the ownership above. In particular, Figma wins for visual or narrative questions, the inspected assets win for media capabilities, and this document wins for architecture and behavior. The original concept document is non-authoritative when it conflicts with Figma or this specification.

The [`Reference Design / Desktop - 16:9`](https://www.figma.com/design/V9aQC1d6rmvSBIlKS2Xqu0/Oscar-s-playground?node-id=2473-132) master and its annotations define the canonical sequence. Its frames represent **visual states**; they do not prescribe scroll distance, state duration, transition duration, easing, or scrub timing.

### Included

- Desktop, including ultrawide formats.
- Scroll-driven storytelling and video.
- Three.js for the two 3D packs and their transformation.
- GSAP and ScrollTrigger for timelines and transitions.
- Smooth scrolling with Locomotive Scroll or an equivalent compatible integration.
- Ambient background video, `scene-1` through `scene-4`, glass cards, and CTAs.
- Initial loader, microinteractions, basic accessibility, and performance optimization.

### Out of scope

- Navbar.
- Footer. The footer visible inside `Section - 7` in Figma is a future reference only and **must not be implemented in this sandbox**.
- A dedicated mobile layout.
- Backend, wallet connection, and XRPL logic.
- Content or sections not defined in Figma or this document.

Do not invent copy, screens, or functionality to fill unspecified gaps.

### Production asset policy

Build UI and copy with DOM/CSS, render the packs from the supplied GLBs, and render the ambient and cinematic media from the supplied video files. Figma exports are visual references only: do not use exported frames, flattened compositions, or raster screenshots from Figma as production backgrounds or substitutes for the supplied implementation assets.

## 3. Experience Model

Build the landing page as a system of persistent fullscreen layers:

```text
Landing Experience
├── Loader overlay
├── Ambient background video
├── Three.js / WebGL
│   ├── Pack A
│   └── Pack B
├── Cinematic video layer
│   ├── scene-1.webm
│   ├── scene-2.webm
│   ├── scene-3.webm
│   └── scene-4.webm
└── DOM / UI
    ├── Glass cards
    ├── Headlines and descriptions
    └── CTAs
```

Keep these layers mounted whenever practical. The timeline should modify position, scale, rotation, lighting, exposure, opacity, visibility, video time, and UI content without rebuilding the experience for every chapter.

Use one persistent WebGL renderer and one **authoritative scroll controller** for the entire experience. The controller maps its scroll position to the canonical state sequence and exposes normalized `0..1` progress for each state or transition. WebGL, video, and UI consumers derive their values from that state progress; they must not create competing progress sources or write to the same visual property independently.

## 4. Assets

The reference resources are located in the project’s root `assets` directory:

- `bg-video-16-9.webm`: looping ambient background.
- The two pack GLB models.
- `scene-1.webm`.
- `scene-2.webm`.
- `scene-3.webm`.
- `scene-4.webm`.
- The visual reference for the `glass-tilt-card` component.

Confirm the actual GLB filenames during implementation. Do not infer them from Figma layer names.

The four cinematic videos form one continuous sequence: the final frame of each `scene-N` visually matches the first frame of the next scene. The implementation must preserve this continuity when scrolling both forward and backward.

### Mandatory implementation preflight

Complete and record an asset preflight before building the experience:

1. Inspect both GLBs and record their actual filenames, scene hierarchy, dimensions and scale, orientation, origins and pivots, mesh and material assignments, texture dependencies, transparency, and animation clips.
2. Inspect every referenced texture for its path, dimensions, format and compression, color-space intent, alpha usage, and any missing or duplicate dependency.
3. Inspect every video for container and codec, pixel dimensions, frame rate, duration, audio tracks, alpha-channel support, and keyframe interval or cadence. Confirm that the chosen browser targets can decode the files as required.
4. Decode and compare the relevant first and last frames. Verify each intended `scene-1 → scene-2 → scene-3 → scene-4` matching-frame join rather than assuming continuity from filenames or Figma.
5. Reflect the verified asset paths, durations, dimensions, and media constraints in `experienceConfig` and the implementation plan.

Preflight is complete only when the findings are recorded and every asset-dependent assumption in the implementation is backed by the inspected files. Resolve or explicitly surface a blocking mismatch before implementing the affected transition.

## 5. Scroll, Timelines, and Reversibility

- The authoritative scroll controller owns the smooth-scroll integration, ScrollTrigger coordination, state boundaries, and progress mapping. Do not combine two smoothing systems or use `scroll-behavior: smooth` alongside Locomotive Scroll.
- Integrate the chosen smooth-scroll solution with ScrollTrigger using the library’s recommended approach, without creating a second scroll authority.
- Map global scroll position to per-state normalized progress from `0` to `1`, then derive transforms, opacity, lighting, UI state, and `video.currentTime` from those values.
- Cinematic videos are not independent autoplay videos: scroll controls their playback time.
- Reverse scrolling must reconstruct earlier states without jumps, flashes, or irreversible flags.
- Handle unavailable video metadata, fast seeks, abrupt direction changes, viewport resizing, and ScrollTrigger refreshes.
- Treat Figma frames as visual state targets only. Determine scroll weights, distances, transition timing, easing, and scrub response during implementation and tuning; do not derive them from frame height or spacing in the Figma master.
- Keep all scroll weights, thresholds, scales, positions, glow intensities, and transition points in `experienceConfig`.

The experience may be represented internally as chapters and states, but Figma must not be translated into eleven independent fullscreen components. These chapters are control points within one continuous scene.

## 6. Canonical Narrative Sequence

The state descriptions below define behavior and preserve Figma’s order; they do not duplicate the full design copy. Use the exact copy, capitalization, and line hierarchy from Figma. Do not invent editorial variants in this document or the implementation.

### State 01 — Hero (`Section - 1`)

Display:

- `bg-video-16-9.webm` fullscreen and looping.
- The two 3D packs in the Figma composition.
- The Hero glass card and CTA labels exactly as shown in Figma.

The packs may have extremely subtle ambient motion. After the loader exits, introduce the background, models, and card as one coordinated reveal.

### State 02 — Pack Repositioning (`Transition - 1`)

As the user scrolls:

- reduce the Hero card’s presence through zoom-out and fade;
- zoom in on the packs;
- progressively swap the positions of both packs.

The transition must remain continuous and must not feel like a page change.

### Content 02 — Two Packs. Two Paths. (`Section - 2`)

Keep the ambient background and the packs behind the centered glass card shown in Figma. Render its Figma copy verbatim; do not translate, correct, or supplement it in the implementation.

### Content 03 — First Drop Reveal (`Section - 3`)

Reveal the centered First Drop glass card with the exact copy and line hierarchy shown in Figma.

The pack pulse begins in this state: their brightness rises and falls progressively, supported by glow and an extremely subtle scale variation. The effect should be noticeable without becoming aggressive.

### State 04 — Fusion and Maximum Glow (`Section - 3` → `Transition - 3.1`)

As scrolling continues:

1. remove the glass card;
2. move and align the two packs until they appear to fuse into one;
3. increase brightness and glow to conceal the exact fusion point;
4. stop the pulse once high brightness has been reached;
5. keep a single pack and begin moving it toward the camera.

Figma represents `Transition - 3.1` as the state in which the fusion already appears complete, the pulse has stopped, and the zoom is beginning.

### State 05 — Maximum Zoom and 3D → `scene-1` Blend (`Transition - 3.2`)

When the pack reaches its maximum approach:

- begin the crossfade;
- reduce the 3D model from `100%` to `0%` presence;
- increase `scene-1.webm` from `0%` to `100%`;
- overlap both layers long enough to conceal the change of medium.

Do not expose black, an empty frame, or the ambient background between the two layers.

### State 06 — Scroll-Controlled `scene-1` (`Transition - 3.3`)

Once `scene-1.webm` is at `100%` opacity, scroll progress controls its playback. Hold its final frame when the video reaches the end.

### Content 04 — Classes at the `scene-1 → scene-2` Join (`Section - 4`)

The final frame of `scene-1` must match the first frame of `scene-2`. Over this stable visual state, reveal the left-aligned Classes glass card with the exact copy shown in Figma.

When scrolling resumes, remove the card and begin scrubbing `scene-2` without breaking the matching-frame transition.

### Content 05 — Rarities at the `scene-2 → scene-3` Join (`Section - 5`)

When `scene-2` finishes, hold its final frame, display the matching first frame of `scene-3`, and reveal the right-aligned Rarities glass card with the exact copy shown in Figma.

During the next scroll range, remove the card and advance `scene-3`.

### Content 06 — Featured Artists at the `scene-3 → scene-4` Join (`Section - 6`)

When `scene-3` finishes, hold the matching frame shared with `scene-4` and reveal the Featured Artists glass card using Figma’s centered composition and exact copy.

As scrolling continues, remove the UI and begin scrubbing `scene-4`.

### State 07 — Return to the Ambient Background (`Section - 7`)

At the final frame of `scene-4`:

1. hold the frame;
2. progressively reduce the cinematic layer’s opacity;
3. reveal `bg-video-16-9.webm` again without a cut;
4. reintroduce the two packs using Figma’s final composition;
5. reveal the final CTA glass card with the exact copy and label shown in Figma.

The footer shown beneath this CTA is not part of the current deliverable.

## 7. Loader and Loading Strategy

The initial loader must prevent the Hero from appearing before its critical resources are ready:

- first-viewport fonts;
- ambient background video;
- both GLBs and their critical textures and materials;
- shaders required for the initial state.

Do not wait for all four cinematic videos to download before revealing the Hero. Load them progressively and prepare each next scene before its transition point.

The loader exit must be part of the narrative: complete its animation, reveal the background, then introduce the models and UI. Do not simply remove it abruptly with `display: none`.

If a secondary resource fails, preserve a usable experience and report the error. Do not leave the loader blocked indefinitely.

## 8. UI and Microinteractions

### Glass cards

- Preserve Figma’s translucent, premium, dimensional appearance.
- Apply cursor-driven tilt with limited amplitude and a smooth return to neutral.
- Avoid reflections or displacement that reduce copy legibility.
- Entrance and exit animations may combine opacity, vertical translation, minimal scale, and subtle blur.

### CTAs

- Hover: a small change in scale, border, background, or glow.
- Pointer movement: an optional magnetic effect with tightly limited displacement.
- Pointer down: brief compression for immediate feedback.
- Pointer leave: a smooth and stable return to the initial state.
- Preserve visible focus and keyboard activation.

Microinteractions must support the visual hierarchy rather than compete with the 3D scene or videos.

## 9. Performance and Audiovisual Continuity

### Three.js

- Use one renderer, one canvas, and one WebGL context for the experience.
- Cap the device pixel ratio at a reasonable value.
- Reuse geometry, materials, and textures.
- Update only uniforms and transforms that actually change.
- Pause or reduce work when the tab is not visible.
- Dispose of geometry, materials, textures, and the renderer on unmount.

### Video

- Use `muted` and `playsInline`.
- Reuse the same media resource for preload and playback so the application does not trigger duplicate full downloads. Do not give every scene maximum priority at startup.
- Prepare the next scene before its transition point.
- Encode videos intended for scrubbing with sufficiently frequent keyframes for responsive seeking.
- Do not insert fades to black between `scene-1`, `scene-2`, `scene-3`, and `scene-4`.
- Avoid redundant seeks when the target time has barely changed.

### Runtime

- Prefer transforms, opacity, and uniforms; avoid layout thrashing.
- Do not recreate timelines, listeners, or `requestAnimationFrame` loops on every render.
- Keep frame-by-frame scroll values outside React state; use refs and the authoritative experience controller so scrolling does not continuously re-render the React tree.
- Test fast scrolling, reverse scrolling, and viewport resizing without flashes, jumps, or desynchronization.

## 10. Desktop, Ultrawide, and Accessibility

The Figma `Desktop - 16:9` master is a **1920 × 11880** long-form narrative board. Its internal sections and visual states are approximately **1920 × 1080** compositional references, not rigid viewport coordinate templates. The master’s total height and the spacing between its internal states do not define runtime scroll distance or timing.

Validate at least:

- 16:9.
- 16:10.
- 21:9.
- Narrow desktop viewports.
- Ultrawide viewports.

Background and cinematic media may use responsive cover-style cropping when necessary, provided the focal subject and the intended composition remain legible. Use focal-point-aware positioning rather than a fixed center crop. Keep UI and the main 3D pack subjects inside responsive safe areas so cards, CTAs, and primary 3D content are not clipped. Use `clamp()` limits and relative anchors where appropriate.

Detect `prefers-reduced-motion`. In this mode, complex scrubbing may be replaced by static states or simple transitions while preserving content, contrast, focus, and keyboard navigation.

## 11. Next.js Integration Boundaries

- Keep the route and static shell server-renderable by default. Place Three.js, GSAP, smooth scrolling, media control, pointer interactions, and other browser-only behavior behind the smallest practical client boundaries.
- Keep the server render and first client render deterministic. Do not read `window`, `document`, media metadata, viewport dimensions, WebGL capabilities, or mutable browser state during server rendering; initialize them inside the owning client boundary after mount.
- Encapsulate every side effect with the component or controller that owns it. Effects must have stable dependencies and symmetrical cleanup so remounting does not duplicate controllers, timelines, listeners, media work, or render loops.
- Keep the experience self-contained and portable. Do not mount its controller or local providers in the root layout, add an application-wide provider for experience-only state, or introduce unrelated global side effects.
- Any global CSS required by the experience must be narrowly scoped and must not change unrelated routes or components.

## 12. Organization and Cleanup

Separate responsibilities without enforcing a rigid structure. For example:

```text
LandingExperience
├── LoadingGate
├── ScrollController
├── AmbientBackground
├── WebGLScene
├── CinematicSequence
├── StoryOverlay
│   ├── GlassTiltCard
│   └── CTAButton
└── experienceConfig
```

`experienceConfig` is required. It must centralize the canonical state order, asset paths and verified media metadata, scroll weights, thresholds, scales, positions, glow values, transition parameters, breakpoints, and other tuning values. Components and timelines consume this configuration instead of scattering magic values or maintaining parallel copies. Figma remains the source of truth for copy.

Avoid one oversized component containing the 3D scene, videos, all DOM content, and every timeline.

On unmount, clean up:

- GSAP timelines and contexts;
- ScrollTriggers;
- the smooth-scroll instance;
- `requestAnimationFrame` loops;
- window, pointer, and video listeners;
- Three.js resources;
- pending timers, observers, and callbacks.

## 13. Definition of Done

The implementation is ready when:

- the Hero appears only after its critical resources are loaded and is revealed through a polished transition;
- composition and copy follow `Reference Design / Desktop - 16:9`;
- the order is Hero → repositioning → Two Packs → First Drop Reveal → fusion/zoom → `scene-1` → Classes → `scene-2` → Rarities → `scene-3` → Featured Artists → `scene-4` → ambient return → CTA;
- the pulse begins during First Drop Reveal and stops at high brightness before the zoom;
- the Three.js → `scene-1` blend conceals the change of medium;
- the `scene-1 → 2 → 3 → 4` joins do not reveal black, empty frames, or the background between scenes;
- the end of `scene-4` crossfades back to `bg-video-16-9.webm`;
- forward, reverse, and fast scrolling maintain coherent states;
- glass cards and CTAs provide subtle, accessible microinteractions;
- the experience performs reliably across desktop and ultrawide viewports;
- the browser network panel shows no duplicate full-asset downloads caused by separate preload and runtime consumers; legitimate byte-range requests made by the video element are not treated as duplicate downloads;
- exactly one WebGL context is active for the experience, and repeated mounts do not increase the number of contexts;
- React profiling during scroll shows no frame-by-frame component render loop; visual updates occur through the authoritative controller, refs, Three.js objects, media elements, or GSAP-owned values;
- unmounting stops every `requestAnimationFrame` loop and removes every experience-owned listener, ScrollTrigger, timeline, smooth-scroll instance, observer, timer, and callback, with no multiplication after remount;
- unmounting disposes WebGL geometry, materials, textures, and the renderer, releases media references, and allows memory to recover reasonably toward its pre-mount baseline instead of retaining monotonic growth across repeated mount/unmount checks;
- there is no navbar or footer;
- no unspecified content has been added;
- the experience remains portable to the production Next.js application without root-layout changes or experience-only global providers.
