# Mutable Soldiers assets

Production media served by the landing page:

```text
bg-video-16-9.webm
mutable-pack-green-web.glb
mutable-pack-purple-web.glb
scenes-h264-scroll.mp4
```

The application uses the 2560 × 1440 H264 `scenes-h264-scroll.mp4` sequence. It is
encoded with a fixed 0.5-second keyframe cadence (`-g 15 -keyint_min 15
-sc_threshold 0`) and no B-frames (`-bf 0`) so every scroll seek decodes at
most 15 forward-only frames from the nearest keyframe — this is what keeps
scroll-scrubbing smooth. AV1 was dropped for this asset because software AV1
decode (the common case on end-user devices) made scroll-scrubbing lag
regardless of keyframe interval; AV1 stays in use for `bg-video-16-9.webm`
since that layer only ever plays forward and never seeks. Its authored scene
endpoints are `02:00`, `04:00`, and `06:22` in seconds:frames notation at
30 fps.

If the GLB filenames differ, set `NEXT_PUBLIC_PACK_GREEN_URL` and
`NEXT_PUBLIC_PACK_PURPLE_URL` or update `lib/experience/assets.ts`.

The application intentionally renders diagnostic fallbacks when these files
are absent. Those fallbacks are development aids and are not final artwork.
