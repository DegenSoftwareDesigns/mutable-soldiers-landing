import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("bootstrap gates the runtime behind a detected profile", async () => {
  const source = await read(
    "components/experience/MutableSoldiersExperience.tsx",
  );

  assert.match(source, /detectExperienceProfile\(nextPreview\.deviceOverride\)/);
  assert.match(source, /if \(!profile\)/);
  assert.match(source, /<ExperienceRuntime profile=\{profile\} preview=\{preview\}/);
  assert.match(source, /Number\(cinematicPreloadReady\)/);
  assert.match(source, /criticalReadyCount \/ 5/);
  assert.match(
    source,
    /fontsReady && ambientReady !== null && packStatus !== null[\s\S]*!cinematicPreloadReady/,
  );
});

test("runtime exposes the selected profile and handles aspect changes", async () => {
  const source = await read(
    "components/experience/MutableSoldiersExperience.tsx",
  );

  assert.match(source, /data-device=\{layoutProfile\.device\}/);
  assert.match(source, /data-orientation=\{layoutProfile\.orientation\}/);
  assert.match(source, /data-aspect=\{layoutProfile\.aspectBucket\}/);
  assert.match(source, /profileSelectionChanged\(profile, next\)/);
  assert.match(source, /setLayoutProfile\(next\)/);
  assert.match(source, /window\.location\.reload\(\)/);
  assert.match(source, /mutable-soldiers:aspect-dismissed:/);
});

test("touch profiles use native scroll and static cards", async () => {
  const [smoothScroll, experience, tiltCard] = await Promise.all([
    read("components/experience/useSmoothScroll.ts"),
    read("components/experience/MutableSoldiersExperience.tsx"),
    read("components/spectrumui/tilt-card.tsx"),
  ]);

  assert.match(smoothScroll, /profile\?\.inputMode === "coarse"/);
  assert.match(smoothScroll, /window\.history\.scrollRestoration = "manual"/);
  assert.match(smoothScroll, /window\.scrollTo\(\{ top: 0, behavior: "instant" \}\)/);
  assert.match(
    experience,
    /profile\.device === "desktop" && profile\.inputMode === "fine"/,
  );
  assert.match(tiltCard, /interactive && glare/);
  assert.match(tiltCard, /onPointerMove=\{interactive \? handlePointerMove : undefined\}/);
});

test("responsive preview is development-only and uses real iframe viewports", async () => {
  const [page, workbench, styles, experience] = await Promise.all([
    read("app/dev/responsive-preview/page.tsx"),
    read("components/experience/ResponsivePreviewWorkbench.tsx"),
    read("app/globals.css"),
    read("components/experience/MutableSoldiersExperience.tsx"),
  ]);

  assert.match(page, /process\.env\.NODE_ENV === "production"/);
  assert.match(page, /notFound\(\)/);
  assert.match(workbench, /Mobile · 390×844/);
  assert.match(workbench, /Tablet · 768×1024/);
  assert.match(workbench, /<iframe/);
  assert.match(workbench, /experiencePreview: "1"/);
  assert.match(
    experience,
    /const narrativeEnd[\s\S]*\[data-layer="closing"\][\s\S]*offsetTop[\s\S]*targetProgress/,
  );
  assert.match(styles, /data-device="mobile"\]\[data-orientation="portrait"\]/);
  assert.match(styles, /data-device="tablet"\]\[data-orientation="portrait"\]/);
});

test("WebGL quality is capped per profile and touch raycasting is disabled", async () => {
  const [source, styles] = await Promise.all([
    read("components/experience/PackSceneCanvas.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(source, /maxDprForProfile\(profile\)/);
  assert.match(source, /profile\.device === "mobile"/);
  assert.match(source, /profile\.device === "tablet"/);
  assert.match(source, /if \(interactionEnabled\)/);
  assert.match(source, /assetSet\.assets\.packA\.src/);
  assert.match(source, /assetSet\.assets\.packB\.src/);
  assert.match(
    source,
    /profile\.device === "mobile"[\s\S]*?xScale:\s*0\.5,[\s\S]*?objectScale:\s*0\.55,[\s\S]*?yOffset:\s*1\.25/,
  );
  assert.match(source, /\) \+ layoutTuning\.yOffset/);
  assert.match(
    styles,
    /data-device="mobile"\]\[data-orientation="portrait"\] \.story-card\[data-card="hero"\][^}]*bottom:\s*max\(3svh/s,
  );
});
