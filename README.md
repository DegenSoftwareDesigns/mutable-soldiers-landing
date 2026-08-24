# Mutable Soldiers Landing

Standalone cinematic landing-page sandbox for the ARMY Mutable Soldiers
collection. The experience follows the Figma `Reference Design / Desktop -
16:9` narrative with a persistent Three.js scene, scroll-scrubbed video and
GSAP transitions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Add `?debug` to display the current global
progress, chapter and asset status.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Project references

- `mutable-soldiers-implementation-spec.md` — implementation source of truth.
- `IMPLEMENTATION_PLAN.md` — milestone roadmap and current status.
- `ASSET_PREFLIGHT.md` — verified video, GLB and matching-frame findings.

The project deliberately contains no navbar, footer, backend, wallet or XRPL
logic. Production integration is a separate handoff.
