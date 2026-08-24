# Mutable Soldiers assets

Production media served by the landing page:

```text
bg-video-16-9.webm
mutable-pack-green-web.glb
mutable-pack-purple-web.glb
scene-1-web.webm
scene-2-web.webm
scene-3-web.webm
scene-4-web.webm
```

If the GLB filenames differ, set `NEXT_PUBLIC_PACK_GREEN_URL` and
`NEXT_PUBLIC_PACK_PURPLE_URL` or update `lib/experience/assets.ts`.

The application intentionally renders diagnostic fallbacks when these files
are absent. Those fallbacks are development aids and are not final artwork.
