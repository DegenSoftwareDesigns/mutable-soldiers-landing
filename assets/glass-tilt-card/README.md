# GlassTiltCard

A card with a real glass effect (refraction, a reflection that follows the
cursor, chromatic aberration) that tilts in 3D based on mouse position.
No external dependencies — just React/Next.js.

## Installation

1. Copy the whole `components/glass-tilt-card/` folder into your project
   (for example into `src/components/glass-tilt-card/`).
2. Mount `<GlassFilters />` **once**, near the root of the tree (in
   `app/layout.tsx`). This is required because the refraction effects use
   SVG filters referenced by id (`url(#glass-distortion)`), and those ids
   are global to the document — you don't need to repeat this for every
   card.

```tsx
// app/layout.tsx
import { GlassFilters } from "@/components/glass-tilt-card";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlassFilters />
        {children}
      </body>
    </html>
  );
}
```

3. Use `<GlassTiltCard />` wherever you need it. Sizing is controlled by
   whoever uses it, by wrapping it in a container (so it stays reusable
   across grids, heroes, whatever):

```tsx
import { GlassTiltCard } from "@/components/glass-tilt-card";

export function Example() {
  return (
    <div className="w-[380px] aspect-[3/4]">
      <GlassTiltCard>
        <img
          src="/mutable-soldiers.jpg"
          alt="Mutable Soldiers"
          className="h-full w-full object-cover opacity-40 mix-blend-screen"
        />
      </GlassTiltCard>
    </div>
  );
}
```

Without `children`, it's a pure glass panel (same as what you see when
opening the standalone `glass-tilt-card.html` reference).

## Props

| Prop        | Type        | Default | What it does                                              |
| ----------- | ----------- | ------- | ------------------------------------------------------------ |
| `children`  | `ReactNode` | —       | Content inside the card (image, text, etc.)                  |
| `className` | `string`    | —       | Extra classes for the outer container                        |
| `maxTilt`   | `number`    | `12`    | Maximum tilt angle in degrees, on each axis                  |
| `idleFloat` | `boolean`   | `true`  | If `false`, the card stays still outside of hover             |

## Technical notes for the dev

- **Why a CSS Module and not just Tailwind**: the effects (`backdrop-filter`
  with an SVG filter, layers using `mix-blend-mode`, the idle-float
  `@keyframes`, the `box-shadow` stack driven by CSS variables) don't
  translate well to utility classes. Layout/positioning around the card
  can still go through Tailwind normally via `className`.
- **Why mouse events live on `.stage` and not on the card itself**: the
  card is transformed in 3D (rotated/scaled). If hover hit-testing were
  calculated against the transformed card, the browser would fire
  `mouseenter`/`mouseleave` in a loop near the edges (the surface "moves"
  as it rotates, the cursor ends up technically outside, re-enters, and
  so on → flicker). `.stage` never gets a transform, so it's a stable
  hover target.
- **Safari**: `backdrop-filter: url(#id)` (the refraction filter) isn't
  supported in Safari/WebKit. It falls back safely to a plain blur via
  `-webkit-backdrop-filter`, which still looks good, just without the
  distortion.
- This is a purely presentational component — it doesn't need Zustand or
  TanStack Query. If `children` ever needs remote data (e.g. a
  collection's thumbnail), resolve that above, in whatever component
  uses this one, and pass it down already resolved as `children`.
- Respects `prefers-reduced-motion` (disables the idle animation and
  transitions).

## Reference file

`glass-tilt-card.html` (standalone, plain HTML/CSS/JS) has the exact same
behavior — useful for visually comparing against if something breaks
during the React migration.
