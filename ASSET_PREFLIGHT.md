# Mutable Soldiers — Asset Preflight

Date: 2026-08-26

This preflight records the media properties used by the runtime. The original
files were supplied in the repository's `assets` folder and are served by the
Next.js sandbox from `public/assets`.

## Video inventory

All videos are 30 fps and use 8-bit `yuv420p` without an alpha channel. The
supplied cinematic source carries AV1 video and a silent AAC track; the runtime
derivative carries H.264 video without audio.

| File | Dimensions | Duration | Size | Average bitrate | Keyframe cadence |
| --- | ---: | ---: | ---: | ---: | ---: |
| `bg-video-16-9.webm` | 2560 × 1440 | 12.000 s | 9.80 MB | 6.53 Mbps | 5.37 s |
| `scenes.mp4` (source) | 1920 × 1080 | 18.344 s | 8.52 MB | 3.72 Mbps | 5.00 s |
| `scenes-scroll.mp4` (runtime) | 1920 × 1080 | 18.333 s | 20.65 MB | 9.01 Mbps | 0.50 s |

The cinematic sequence is one continuous resource. Its authored pause frames
are `04:06`, `10:05`, and `15:05` in seconds:frames notation. At 30 fps these
map to 4.200 s, 10.167 s, and 15.167 s. The last video frame is at 18.300 s and
visually matches the opening frame of `bg-video-16-9.webm`, so the runtime can
crossfade back to the ambient loop without an intermediate media handoff.

The supplied AV1 encode fell as much as 2 seconds behind the target time during
a repeatable continuous-scroll test. The H.264 runtime derivative reduced the
same measured lag to zero by shortening the keyframe interval to 0.5 seconds.
The runtime still coalesces pending seeks and ignores changes below half a
frame.

## GLB inventory

| Property | Green pack | Purple pack |
| --- | --- | --- |
| File | `mutable-pack-green-web.glb` | `mutable-pack-purple-web.glb` |
| Size | 4.10 MB | 3.98 MB |
| Scene root | `PackBody` | `PackBody` |
| Bounds | −0.5, −0.75, −0.04118 → 0.5, 0.75, 0.04368 | same |
| Dimensions | 1.0 × 1.5 × 0.08486 | same |
| Hierarchy | 1 node, 1 mesh, 3 primitives | same |
| GPU upload vertices | 19,938 | 19,938 |
| Materials | 3 opaque PBR materials | 3 opaque PBR materials |
| Textures | 6 embedded | 6 embedded |
| Animations / cameras | none / none | none / none |

Both assets are centered closely around their geometric origin, use a vertical
Y axis and present the artwork along the thin Z axis. Runtime normalization is
still bounds-based so future model replacements preserve framing.

The materials use `KHR_materials_clearcoat`,
`KHR_materials_iridescence`, and `KHR_materials_sheen`; none is marked as a
required extension. Each model embeds:

- front and back artwork as 1536 × 2304 JPEG;
- two 768 × 1152 PNG roughness images;
- one 768 × 1152 PNG micro-normal image;
- one 512 × 768 PNG iridescence-thickness image.

There are no external texture paths, missing dependencies, transparent
materials, or embedded animation clips. Lighting, pulse, convergence, zoom and
opacity therefore belong to the runtime controller.

## Implementation consequences

- The loader gates fonts, the ambient background and both GLBs only.
- The 20.65 MB cinematic MP4 starts with metadata preload and upgrades to
  automatic preload before its first reveal; the Hero does not wait for it.
- One WebGL renderer owns both models.
- Video time is derived from normalized global progress, with redundant seeks
  ignored below one frame.
- The model material extensions are preserved by Three.js's GLTF loader.
- The cinematic sequence has no internal media joins to conceal or coordinate.
