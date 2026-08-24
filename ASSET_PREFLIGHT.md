# Mutable Soldiers — Asset Preflight

Date: 2026-08-24

This preflight records the media properties used by the runtime. The original
files were supplied in the repository's `assets` folder and are served by the
Next.js sandbox from `public/assets`.

## Video inventory

All videos are 2560 × 1440, 30 fps, WebM, silent, and use 8-bit `yuv420p`
without an alpha channel.

| File | Codec | Duration | Size | Average bitrate | Keyframe cadence |
| --- | --- | ---: | ---: | ---: | ---: |
| `bg-video-16-9.webm` | AV1 | 12.000 s | 9.80 MB | 6.53 Mbps | 5.37 s |
| `scene-1-web.webm` | VP9 | 4.966 s | 6.37 MB | 10.26 Mbps | every frame |
| `scene-2-web.webm` | VP9 | 5.966 s | 6.72 MB | 9.01 Mbps | every frame |
| `scene-3-web.webm` | VP9 | 7.933 s | 13.92 MB | 14.04 Mbps | every frame |
| `scene-4-web.webm` | VP9 | 4.966 s | 7.57 MB | 12.20 Mbps | every frame |

The cinematic files are suitable for frame-accurate scroll seeking because
every frame is a keyframe. The ambient AV1 file is autoplayed as a loop and is
not scrubbed. If AV1 decoding is unavailable, the implementation falls back to
its ambient CSS treatment rather than blocking the loader.

## Cinematic joins

First and final decoded frames were inspected side by side and measured with
FFmpeg PSNR. Values are affected by lossy encoding, so visual inspection is the
deciding signal.

| Join | PSNR | Finding | Runtime treatment |
| --- | ---: | --- | --- |
| scene 1 → scene 2 | 11.95 dB | The supplied frames are different compositions. | Short reversible crossfade; no black frame. |
| scene 2 → scene 3 | 23.53 dB | Visually matching Viking frame. | Overlapped matching-frame handoff. |
| scene 3 → scene 4 | 19.42 dB | Visually matching Egyptian frame. | Overlapped matching-frame handoff. |

The first join does not satisfy the specification's literal matching-frame
assumption. Re-encoding or replacing one of those clips is required if an
identical hard cut is desired later.

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
- Cinematic videos load progressively; the Hero does not wait for all 33.8 MB.
- One WebGL renderer owns both models.
- Video time is derived from normalized global progress, with redundant seeks
  ignored below one frame.
- The model material extensions are preserved by Three.js's GLTF loader.
- The exact first scene join remains the only asset-level fidelity limitation.
