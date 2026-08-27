# Mutable Soldiers — Landing Design Specification

## Scope

This document captures the reusable visual language already implemented in the
Mutable Soldiers landing page. Use it when creating or modifying components so
that typography, color, spacing, glass surfaces, and controls remain consistent.

This version intentionally excludes the footer, video, 3D rendering, media
loading, and scroll-story mechanics. Add footer guidance only after that
component exists and has been approved.

## Visual direction

Mutable Soldiers uses a dark science-fiction presentation with high-contrast
white typography, restrained violet/cyan energy accents, and dimensional glass
surfaces. The composition is spacious and cinematic; effects reinforce content
hierarchy rather than decorating every element.

The visual hierarchy is:

1. Large geometric display typography.
2. A translucent glass surface separating content from the background.
3. Violet/cyan energy reserved for emphasis and interaction.
4. Compact, highly legible supporting copy.

## Color system

### Core tokens

| Token | Value | Role |
| --- | --- | --- |
| `--page-bg` | `#02030a` | Page and stage background |
| `--text` | `#f7f6ff` | Primary text |
| `--muted` | `rgba(247, 246, 255, 0.76)` | Secondary text |
| `--glass` | `rgba(20, 18, 31, 0.54)` | General glass reference |
| `--glass-border` | `rgba(255, 255, 255, 0.24)` | General glass-border reference |
| `--violet` | `#8c3cff` | Primary energy accent |
| `--cyan` | `#24ebe0` | Secondary energy and focus accent |

The base page always uses the dark color scheme. White is the dominant content
color; violet and cyan must remain accents. Do not introduce another saturated
accent without updating this document and the root tokens.

### Supporting values

- Standard body copy: `rgba(247, 246, 255, 0.92)`.
- Loader label: `rgba(255, 255, 255, 0.68)`.
- Loader value: `rgba(255, 255, 255, 0.52)`.
- Text shadow over complex backgrounds: `0 1px 8px rgba(0, 0, 0, 0.58)`.
- Keyboard focus: `2px solid var(--cyan)` with `4px` offset.

## Typography

### Font families

| Role | Family | Available weights |
| --- | --- | --- |
| Display | `"Audiowide", "Eurostile", "Bank Gothic", system-ui, sans-serif` | Audiowide 400 |
| Body and controls | `"Rajdhani", ui-sans-serif, system-ui, sans-serif` | Rajdhani 600 and 700 |

Use Audiowide for headlines, collection labels, large numbers, and compact brand
marks. Use Rajdhani for paragraphs, controls, labels, and functional text. Never
use Audiowide for long-form copy.

### Type scale

| Role | Size | Weight | Line height | Tracking |
| --- | --- | ---: | ---: | ---: |
| Primary heading | `clamp(3rem, 5.35vw, 6.4rem)` | 500 | `0.88` | `-0.045em` |
| Hero heading | `clamp(3rem, 5.1vw, 6.1rem)` | 500 | `0.88` | `-0.045em` |
| Section heading | `clamp(2.65rem, 5.1vw, 6rem)` | 500 | `0.88` | `-0.045em` |
| Artists heading | `clamp(3rem, 5.1vw, 6.1rem)` | 500 | `0.88` | `-0.045em` |
| Final heading | `clamp(3rem, 5.1vw, 6.2rem)` | 500 | `0.88` | `-0.045em` |
| Collection label | `clamp(1.35rem, 2.1vw, 2.5rem)` | 400 | normal | `0.02em` |
| Display number | `clamp(2.2rem, 4vw, 4.8rem)` | 400 | `0.82` | normal |
| Body copy | `clamp(1rem, 1.08vw, 1.12rem)` | 600 | `1.55` | `0.012em` |
| CTA label | `0.86rem` | 650 | normal | normal |
| Utility label | `0.72rem` | 600 | normal | `0.19em` |
| Utility value | `0.72rem` | 600 | normal | `0.14em` |

Display headings use balanced wrapping and may split semantic phrases into
explicit block-level lines. Paragraphs have a maximum width of `72ch` and sit
`1.2rem` below their heading. Utility labels are uppercase.

## Spacing and composition

There is no general spacing token scale yet. Until one is introduced, reuse the
existing component values instead of creating near-duplicates.

- Standard glass-card padding: `clamp(1.5rem, 2.3vw, 2.75rem)`.
- Hero glass-card padding: `clamp(1.65rem, 2.1vw, 2.5rem)`.
- CTA group top margin: `clamp(1.2rem, 2vw, 2rem)`.
- CTA group gap: `0.75rem`.
- Story content is vertically centered unless its variant explicitly anchors it
  lower in the viewport.
- Centered cards center both heading and body copy; lateral cards remain
  left-aligned.

### Landing card layouts

| Variant | Desktop placement and width |
| --- | --- |
| Hero | Left inset may grow only until it reaches the shared `112rem` shell; width `clamp(32rem, 36vw, 42rem)` |
| Center | Centered; width `min(40.1vw, 48.1rem)` |
| Wide reveal | Centered; width `min(57.1vw, 68.6rem)` |
| Left statistic | Left `clamp(2rem, 13vw, 16rem)`; width `min(34vw, 41rem)` |
| Right statistic | Right `clamp(2rem, 7vw, 8.5rem)`; width `min(45vw, 54rem)` |
| Artists | Bottom `16%`, centered; width `min(66vw, 79rem)` |
| Final CTA | Top `42%`, centered; width `min(58vw, 69rem)` |

These placements describe the landing compositions, not universal page-layout
templates. Reuse their internal spacing and typography before reusing their
viewport positioning.

## Glass card

### Structure

A glass card consists of a stable perspective stage, the glass surface, two tint
layers, content, a pointer-driven specular layer, subtle chromatic edging, and a
final edge highlight. Content sits at `translateZ(18px)`.

### Surface recipe

- Radius: `clamp(1.75rem, 2.6vw, 3.125rem)`.
- Perspective: `1200px`.
- Border: `1px solid rgba(255, 255, 255, 0.15)`.
- Main blur: `clamp(36px, 3vw, 46px)`.
- Backdrop treatment: `saturate(106%) brightness(0.92)`.
- Main tint:

  ```css
  linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(8, 9, 18, 0.22) 32%,
    rgba(6, 7, 16, 0.5) 70%,
    rgba(3, 4, 11, 0.72) 100%
  )
  ```

- Secondary tint: `rgba(4, 5, 12, 0.1)`, offset `3px 2px`, scale `1.008`,
  opacity `0.55`, `soft-light` blend.
- Default shadow combines a subtle white upper inset, dark lower inset, faint
  internal haze, and a deep `rgba(0, 0, 0, 0.55)` cast shadow.
- Edge lighting stays subtle: white highlights are structural, not glowing
  outlines.

### Interaction

- Landing cards use a maximum tilt of `8deg` per axis.
- Resting pose: `rotateX(2deg) rotateY(-3deg)`.
- Active scale: `1.015`.
- Return: `600ms cubic-bezier(0.23, 1, 0.32, 1)`.
- Idle float: six-second ease-in-out cycle, moving at most `8px` vertically and
  `2deg` on either rotational axis.
- The specular reflection follows the pointer and appears only while active.
- Chromatic aberration remains a thin edge detail, never a full-content filter.
- Disable tilt, idle motion, and transition effects when reduced motion is
  requested.

Do not nest glass cards. Do not reproduce the style with blur alone; the layered
tints, border, inset lighting, and dark lower gradient are essential.

## CTA buttons

### Shared geometry and type

- Minimum height: `3rem`.
- Padding: `0.78rem 1.35rem`.
- Radius: `999px`.
- Label: Rajdhani, `0.86rem`, weight `650`.
- Text: white with `0 1px 3px rgba(0, 0, 0, 0.78)` shadow.
- Shape: translucent dark capsule with a white top reflection and controlled
  violet/cyan energy at its edges.

### Primary palette

| Property | Value |
| --- | --- |
| Border | `rgba(255, 255, 255, 0.58)` |
| Glow | `rgba(132, 64, 255, 0.28)` |
| Tint start | `rgba(139, 75, 255, 0.25)` |
| Tint end | `rgba(36, 235, 224, 0.12)` |
| Left energy | `rgba(132, 64, 255, 0.68)` |
| Right energy | `rgba(36, 235, 224, 0.52)` |

### Secondary palette

| Property | Value |
| --- | --- |
| Border | `rgba(255, 255, 255, 0.36)` |
| Glow | `rgba(36, 235, 224, 0.12)` |
| Tint start | `rgba(255, 255, 255, 0.1)` |
| Tint end | `rgba(3, 4, 11, 0.3)` |
| Left energy | `rgba(132, 64, 255, 0.36)` |
| Right energy | `rgba(36, 235, 224, 0.42)` |

### States

- Hover: move up `1px`, scale to `1.01`, brighten the border, and strengthen
  internal violet/cyan energy.
- Active: move down `1px`, scale to `0.985`, reduce the upper reflection, and
  deepen the inset shadow.
- Focus-visible: cyan `2px` outline with `4px` offset.
- State transitions use `160–180ms`; transforms use
  `cubic-bezier(0.2, 0, 0, 1)`.

Do not replace the CTA with a flat neon fill or a generic gradient button. Its
identity comes from translucent depth, an upper reflection, and restrained
dual-color energy.

## Site navbar

The landing navbar is a compact, non-tilting glass card that floats above the
experience. It must remain visually related to the content cards without
competing with their scale or motion.

### Placement and structure

- Position: `sticky` with `top: 2rem` (`32px`).
- Desktop width: `min(calc(100% - 4rem), 112rem)`.
- Radius: `1.35rem`.
- Minimum inner height: `4.25rem`.
- Desktop layout: three columns using `minmax(0, 1fr) auto minmax(0, 1fr)` so
  the navigation remains optically centered even when the outer columns differ.
- Inner spacing: `0.5rem 0.55rem 0.5rem 1rem` with a `1rem` column gap.
- Layer order: above all experience content and below the loading screen.

The `112rem` maximum is shared by the navbar and the lateral landing cards.
At ultrawide sizes, left- and right-aligned cards stop at that shell instead of
continuing to drift toward the viewport edges.

The left column contains the brand, the middle column contains page navigation,
and the right column contains the wallet CTA. Until a final logo asset exists,
the brand uses the circular Audiowide `MS` mark plus the uppercase
`Mutable Soldiers` wordmark.

### Navigation and actions

- Items: `Home`, `Waitlist`, `Artists`, and `Drops`.
- `Home` is the active item and links to `#hero`.
- Pages without implemented destinations render as disabled buttons, not empty
  or placeholder links.
- Navigation labels use Rajdhani at `0.82rem`, weight `700`, uppercase, and
  `0.055em` tracking.
- The active item uses a restrained white glass tint and faint violet shadow.
- Inactive enabled items may lift `1px` on hover; disabled items do not animate.
- The right action reuses the primary CTA recipe with a navbar-specific minimum
  height of `2.75rem` and the label `Connect Wallet`.
- Keyboard focus uses the shared cyan outline. Interactive targets reach at
  least `44px` high on compact layouts.

### Responsive behavior

- At `760px` and below, the navbar becomes a two-row layout: brand and wallet
  action on the first row, navigation spanning the second row.
- Mobile width is `calc(100% - 2rem)` while the `32px` top offset remains.
- At `440px` and below, hide only the written brand name; retain the `MS` mark,
  all four navigation items, and the wallet action.
- Do not replace the navigation with a menu until the number or length of routes
  makes the four-item row fail at the `320px` minimum supported width.

## Supporting component patterns

### Display statistics

Use the Audiowide display number immediately above the section heading. The
number uses `clamp(2.2rem, 4vw, 4.8rem)` with `0.82` line height and only
`0.1em` bottom spacing. It establishes hierarchy but uses the standard text
color rather than an accent fill.

### Collection and utility labels

Collection labels may use Audiowide at display-label scale. Functional labels
use Rajdhani, uppercase, compact sizes, and expanded tracking. Do not use a
large pill or badge unless the component has an actual interactive or semantic
role.

### Experience loader

- Background: `#03030a` with a centered violet radial glow
  `rgba(111, 34, 212, 0.22)`.
- Mark: `5rem` circle, `1px` white border at `0.4` alpha, Audiowide `1.25rem`,
  violet `3rem` glow.
- Track: `min(15rem, 56vw)` by `1px`, with a transparent → cyan → violet fill.
- Labels: uppercase Rajdhani `0.72rem` with expanded tracking.

## Responsive rules

- Minimum supported page width: `320px`.
- At `960px` and below, hero, left, and right cards become centered with width
  `min(86vw, 44rem)` and no minimum width.
- At `960px` and below, center, artists, and final cards use
  `min(88vw, 46rem)`.
- On viewports wider than a `2:1` aspect ratio, lateral cards narrow and move
  slightly inward; artists and final cards use at most `min(58vw, 79rem)`.
- Typography and card padding scale fluidly through the documented `clamp()`
  values; do not add isolated breakpoint sizes unless the fluid scale fails.
- Reduced motion disables component animations and transitions and removes the
  glass-card transform.

## Consistency rules

### Do

- Use the core tokens instead of copying nearby hex values.
- Preserve the contrast between oversized display text and compact body copy.
- Use violet/cyan energy on interactive or high-priority elements.
- Keep glass surfaces dark enough for white text to remain readable.
- Reuse the existing card padding, radius, and CTA geometry.
- Update this document alongside intentional changes to shared visual rules.

### Do not

- Add unrelated neon colors, rainbow gradients, or bright filled panels.
- Use Audiowide for paragraphs or dense interface text.
- Apply glow to every heading, card, or border.
- Create slightly different radii, padding, or white alpha values without a new
  documented role.
- Treat glass as a generic blur effect.
- Infer footer styling from this document before that component is designed and
  added here.

## Implementation references

The current implementation lives in:

- `app/globals.css` — core tokens, typography, layout variants, CTA, and loader.
- `components/experience/GlassCard.tsx` — reusable glass-card and CTA wrappers.
- `components/experience/SiteNavbar.tsx` — navbar structure, navigation state,
  and wallet action.
- `assets/glass-tilt-card/GlassTiltCard.module.css` — glass surface and states.
- `assets/glass-tilt-card/GlassTiltCard.tsx` — tilt and pointer behavior.

When implementation and documentation intentionally change, update both in the
same change set so that this file remains a reliable specification.
