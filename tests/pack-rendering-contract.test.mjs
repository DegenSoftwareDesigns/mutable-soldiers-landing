import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const packScenePath = new URL(
  "../components/experience/PackSceneCanvas.tsx",
  import.meta.url,
);
const experiencePath = new URL(
  "../components/experience/MutableSoldiersExperience.tsx",
  import.meta.url,
);
const configPath = new URL("../lib/experience/config.ts", import.meta.url);
const assetsPath = new URL("../lib/experience/assets.ts", import.meta.url);
const mediaLayersPath = new URL(
  "../components/experience/MediaLayers.tsx",
  import.meta.url,
);

test("pack fades keep a stable Three.js render mode", async () => {
  const source = await readFile(packScenePath, "utf8");

  assert.doesNotMatch(
    source,
    /material\.transparent\s*=\s*opacity/,
    "transparent must not change while a pack is fading",
  );
  assert.doesNotMatch(
    source,
    /material\.depthWrite\s*=\s*opacity/,
    "depthWrite must not change while a pack is fading",
  );
  assert.match(
    source,
    /configurePackRendering\(packB,\s*0\)/,
    "the rear pack must have an explicit render order",
  );
  assert.match(
    source,
    /configurePackRendering\(packA,\s*1\)/,
    "the front pack must have an explicit render order",
  );
  assert.match(
    source,
    /setPackRenderOrder\(packB,\s*permutationComplete \? 1 : 0\)/,
    "the purple pack must move to the foreground after the permutation",
  );
});

test("pack permutation completes before the depth handoff and fusion", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /permutation:\s*\[0\.235,\s*0\.285\]/);
  assert.match(configSource, /depthHandoff:\s*\[0\.285,\s*0\.33\]/);
  assert.match(configSource, /fusion:\s*\[0\.33,\s*0\.43\]/);
  assert.match(source, /packMotion\.permutation\.greenX,\s*permutation/);
  assert.match(source, /packMotion\.permutation\.purpleX,\s*permutation/);
  assert.match(source, /permutationArc \* packMotion\.permutation\.arcY/);
  assert.match(
    source,
    /setPackRenderOrder\(packA,\s*permutationComplete \? 0 : 1\)/,
  );
});

test("the purple pack remains the visible fusion survivor", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /greenMergeFade:\s*\[0\.39,\s*0\.43\]/);
  assert.match(
    source,
    /setOpacity\(\s*packA,\s*1\s*-\s*smoothstep\(rangeProgress\(progress,\s*packMotion\.ranges\.greenMergeFade\)\)/,
    "the rear green pack must fade during the merge",
  );
  assert.match(source, /setOpacity\(packB,\s*1\)/);
  assert.match(
    source,
    /packB\.transform\.scale\.setScalar\(zoomScale \* breathingScale\)/,
    "the foreground purple pack must own the final zoom",
  );
  assert.match(
    source,
    /lerp\(purplePermutedZ, packMotion\.fusion\.purpleZ, fusion\) \+\s*lerp\(0, packMotion\.fusion\.zoomZ, zoom\)/,
    "the foreground purple pack must move toward the camera",
  );
});

test("hero packs drag independently and convert pointer speed into glow", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(source, /new THREE\.Raycaster\(\)/);
  assert.match(source, /raycaster\.intersectObject\(packA\.transform, true\)/);
  assert.match(source, /raycaster\.intersectObject\(packB\.transform, true\)/);
  assert.match(source, /const speed = Math\.hypot\(velocityX, velocityY\)/);
  assert.match(
    source,
    /state\.energy \* packMotion\.interaction\.emissiveBoost/,
  );
  assert.match(source, /state\.targetOffset\.set\(0, 0\)/);
  assert.match(source, /window\.addEventListener\("pointerdown", onPointerDown/);
  assert.doesNotMatch(
    source,
    /renderer\.domElement\.addEventListener\("pointerdown"/,
    "the full-screen canvas must not capture clicks outside the packs",
  );
  assert.match(configSource, /speedForMaxGlow:\s*1400/);
  assert.match(configSource, /reducedMotionTiltScale:\s*0\.2/);
});

test("GSAP's smoothed playhead is the single progress clock", async () => {
  const source = await readFile(experiencePath, "utf8");

  assert.doesNotMatch(
    source,
    /progressSignal\.set\(self\.progress\)/,
    "raw ScrollTrigger progress would desynchronise Three.js from GSAP scrub",
  );
  assert.match(
    source,
    /timeline\.eventCallback\(\s*"onUpdate"/,
    "the progress signal must follow the GSAP timeline playhead",
  );
});

test("the canvas layer owns the WebGL-to-video crossfade", async () => {
  const source = await readFile(packScenePath, "utf8");

  assert.doesNotMatch(
    source,
    /setOpacity\(\s*packA,\s*1\s*-\s*smoothstep\(\s*rangeProgress\(progress,\s*packMotion\.ranges\.webglFade\)/,
    "fading the model and its canvas at once creates a double fade",
  );
});

test("contract targets the current project", () => {
  assert.match(projectRoot, /mutable-soldiers-landing[\\/]$/);
});

test("one cinematic element scrubs the unified video across authored stops", async () => {
  const [assetsSource, configSource, mediaSource] = await Promise.all([
    readFile(assetsPath, "utf8"),
    readFile(configPath, "utf8"),
    readFile(mediaLayersPath, "utf8"),
  ]);

  assert.match(assetsSource, /src:\s*"\/assets\/scenes-scroll\.mp4"/);
  assert.doesNotMatch(assetsSource, /scene-[1-4]-web\.webm/);
  assert.equal(
    Array.from(mediaSource.matchAll(/<video\b/g)).length,
    2,
    "the experience must render only the ambient and unified cinematic videos",
  );
  assert.match(configSource, /timeAtFrame\(4, 6\)/);
  assert.match(configSource, /timeAtFrame\(10, 5\)/);
  assert.match(configSource, /timeAtFrame\(15, 5\)/);
  assert.match(mediaSource, /cinematicTimeForProgress\(progress\)/);
});

test("native wheel progress is not replaced by chapter navigation", async () => {
  const [source, configSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.doesNotMatch(
    source,
    /useAssistedScroll/,
    "wheel, touch, and keyboard input must remain continuous",
  );
  assert.match(
    source,
    /scrub:\s*true/,
    "Lenis owns smoothing, so ScrollTrigger must track it without extra lag",
  );
  assert.doesNotMatch(
    configSource,
    /assistedScrollAnchors|assistedScroll:/,
    "chapter navigation configuration must not survive as dead code",
  );
});
