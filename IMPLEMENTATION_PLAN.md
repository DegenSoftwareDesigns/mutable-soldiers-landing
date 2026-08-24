# Mutable Soldiers — Implementation Roadmap

## Working model

This repository is an intentionally independent landing-page sandbox. It does
not integrate with the production application; the finished experience must be
portable to its Next.js 14, TypeScript and Tailwind stack.

Figma's `Reference Design / Desktop - 16:9` frame and annotations own visual
composition and narrative order. `mutable-soldiers-implementation-spec.md`
owns runtime behavior and acceptance criteria. `ASSET_PREFLIGHT.md` records
the verified media constraints.

## Architecture

- One persistent fullscreen stage with ambient, WebGL, cinematic, UI and loader
  layers.
- One Lenis smooth-scroll instance integrated with one GSAP ScrollTrigger.
- One normalized `0..1` progress source consumed by Three.js, video and UI.
- One Three.js renderer and camera for both supplied GLBs.
- Four persistent video elements whose time and opacity are derived from the
  master progress.
- Typed configuration for chapter boundaries, media metadata, pack motion,
  crossfades, loader and responsive tuning.
- Scoped side effects with symmetrical cleanup and reduced-motion behavior.

## Milestones

### M0 — Preflight and foundation

- [x] Inspect Figma structure, exact copy and annotations.
- [x] Verify Three.js and GSAP skill coverage.
- [x] Inspect videos, GLBs, materials, textures and matching-frame joins.
- [x] Scaffold the portable Next.js application and diagnostics.

### M1 — Persistent experience and loader

- [x] Create the sticky fullscreen layer stack.
- [x] Gate Hero-critical fonts, ambient media and pack models.
- [x] Add bounded failure handling and a narrative loader exit.
- [x] Integrate smooth scrolling with the single master controller.

### M2 — Hero through transformation

- [x] Implement Hero, pack repositioning, Two Paths and First Drop states.
- [x] Implement pack pulse, convergence, high glow and zoom.
- [x] Crossfade ownership from WebGL to `scene-1`.

### M3 — Cinematic sequence and content

- [x] Implement frame-derived reversible scrubbing for all four scenes.
- [x] Add Classes, Rarities and Featured Artists at their annotated joins.
- [x] Return to the ambient background and packs for the final CTA.
- [x] Exclude navbar and footer.

### M4 — Interaction and responsive behavior

- [x] Add restrained card tilt and CTA hover, press and focus states.
- [x] Add 16:9, 16:10, narrow-desktop and ultrawide composition rules.
- [x] Add `prefers-reduced-motion` behavior.

### M5 — Validation and tuning

- [x] Pass lint, type checking and production build in this repository.
- [x] Validate runtime forward, reverse, fast-scroll and resize behavior.
- [x] Capture canonical checkpoints at 16:9, 16:10 and 21:9.
- [x] Check cleanup, duplicate downloads and avoidable scroll re-renders.
- [x] Record remaining visual or performance differences.

Validation also covered a 1024 × 768 narrow-desktop viewport, keyboard focus,
loader timeout behavior, one-canvas/one-controller ownership, five persistent
video elements, and the explicit absence of navbar and footer.

## Known constraints

- The `scene-1 → scene-2` mismatch is documented in
  `ASSET_PREFLIGHT.md` and handled with a short reversible crossfade.
- The sandbox targets Next.js 14 for production portability. The current npm
  audit reports advisories in that framework/tooling line whose automated fix
  requires a breaking upgrade to Next.js 16. Do not deploy this sandbox as a
  public production site without resolving that integration-level decision.

## Completion rule

The sandbox is complete now that M5 passes. The known `scene-1 → scene-2`
asset mismatch is not hidden: the implementation uses the best reversible
crossfade possible with the supplied files and documents what would be needed
for a literal matching-frame cut.
