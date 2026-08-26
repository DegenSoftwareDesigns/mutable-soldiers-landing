# Mutable Soldiers assets

Production media served by the landing page:

```text
bg-video-16-9.webm
mutable-pack-green-web.glb
mutable-pack-purple-web.glb
scenes-scroll.mp4
```

`scenes.mp4` is the smaller supplied AV1 source. The application uses the
H.264 `scenes-scroll.mp4` derivative because its 0.5-second keyframe cadence is
suited to responsive scroll seeking.

If the GLB filenames differ, set `NEXT_PUBLIC_PACK_GREEN_URL` and
`NEXT_PUBLIC_PACK_PURPLE_URL` or update `lib/experience/assets.ts`.

The application intentionally renders diagnostic fallbacks when these files
are absent. Those fallbacks are development aids and are not final artwork.
