# Mutable Soldiers Landing

Responsive cinematic landing page for the ARMY Mutable Soldiers collection.
Built with Next.js, React, Three.js, GSAP and Lenis, it combines a persistent
3D pack scene, scroll-scrubbed video, glass surfaces and device-aware layouts.

## Current experience

- Landing page with animated hero, scroll narrative, collection cards and a
  closing footer.
- Persistent Three.js scene featuring the green and purple Mutable Packs.
- Desktop, tablet and mobile profiles with adaptive rendering quality and
  native scrolling for touch devices.
- Glass navbar with a responsive menu and visual Connect Wallet CTA.
- `/waitlist` route with client-side XRPL classic-address validation.
- Development-only responsive preview at `/dev/responsive-preview`.

The wallet connection and live waitlist lookup are not connected to a backend
or XRPL service yet. The Artists and Drops navigation entries are intentional
placeholders until their pages are implemented.

## Requirements

- Node.js 18.17 or newer
- npm

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add `?debug` to the home
route to display the current progress, chapter and asset state.

## Useful commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Main cinematic landing experience |
| `/waitlist` | Wallet-address validation and future waitlist lookup |
| `/dev/responsive-preview` | Local-only responsive preview workbench |

## Assets

Production asset details and rendering expectations live in
[`public/assets/README.md`](public/assets/README.md). The core experience
expects the ambient video, the cinematic sequence and both pack GLB files.
When an asset is absent, development fallbacks make the missing dependency
visible instead of failing silently.

To override the pack asset locations, set:

```bash
NEXT_PUBLIC_PACK_GREEN_URL=/path/to/green-pack.glb
NEXT_PUBLIC_PACK_PURPLE_URL=/path/to/purple-pack.glb
```

## Working in parallel

Keep `main` releasable and give each task its own branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/short-task-name
```

Run the validation commands relevant to your change, push the task branch and
open a pull request into `main`. Do not commit local editor configuration or
large source media unless they are required by the running application.

## Project references

- [`TODO.md`](TODO.md) — current product and polish backlog.
- [`mutable-soldiers-implementation-spec.md`](mutable-soldiers-implementation-spec.md)
  — implementation source of truth.
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — milestone roadmap and
  current status.
- [`ASSET_PREFLIGHT.md`](ASSET_PREFLIGHT.md) — verified video, pause-frame and
  GLB findings.
