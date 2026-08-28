# Mutable Soldiers assets

Production media served by the landing page:

```text
bg-video-16-9.webm
mutable-pack-green-web.glb
mutable-pack-purple-web.glb
scenes-cinematic.mp4
```

The application uses the 2560 × 1440 `scenes-cinematic.mp4` sequence, built
from `pt-1.mp4`..`pt-6.mp4` (the raw Higgsfield exports in the repo history —
`pt-6` trimmed to its first 3 seconds) concatenated in order with per-clip
speed ramps (pt-1 2.5x, pt-2 3x, pt-3 2x, pt-4 1.5x, pt-5 3x, pt-6 2x),
giving a 12.1s (363-frame, CFR 30fps) result. It is encoded with a fixed
0.5-second keyframe cadence (`-g 15 -keyint_min 15 -sc_threshold 0`) so every
scroll seek decodes at most 15 frames from the nearest keyframe — this is
what keeps scroll-scrubbing smooth regardless of codec.

Encoded as H264 (`-c:v libx264 -bf 2 -x264-params
aq-mode=1:aq-strength=1.3:deblock=-1,-1:psy-rd=1.0,0.15:no-fast-pskip=1`,
two-pass, ~9.8Mbps, ~14.9MB). AV1 (`libsvtav1`) was tried at the same GOP and
bitrate and looked measurably sharper on the fine detail (thin bright lines
on dark backgrounds), but it still lagged on scroll-scrub on real hardware —
short GOP fixes the "decode from a keyframe far away" problem but not the
underlying cost of software AV1 decode itself, which most devices fall back
to. Don't re-attempt AV1 for this asset without confirming hardware decode
support first. AV1 stays in use for `bg-video-16-9.webm` regardless, since
that layer only ever plays forward and never seeks. Authored scene endpoints
(seconds:frames at 30fps): opening ends `03:19`, after-classes ends `06:19`,
after-rarities ends `10:18`, finale ends `12:03`.

If the GLB filenames differ, set `NEXT_PUBLIC_PACK_GREEN_URL` and
`NEXT_PUBLIC_PACK_PURPLE_URL` or update `lib/experience/assets.ts`.

The application intentionally renders diagnostic fallbacks when these files
are absent. Those fallbacks are development aids and are not final artwork.
