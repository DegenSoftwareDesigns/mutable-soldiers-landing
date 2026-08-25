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

test("First Drop runs fusion and zoom without an intermediate stop", async () => {
  const source = await readFile(configPath, "utf8");
  const anchorBlock = source.match(
    /export const assistedScrollAnchors = \[([\s\S]*?)\] as const;/,
  )?.[1];

  assert.ok(anchorBlock, "assisted scroll anchors must be declared");
  const ids = Array.from(anchorBlock.matchAll(/id:\s*"([^"]+)"/g), (match) =>
    match[1],
  );
  const firstDropIndex = ids.indexOf("first-drop");

  assert.notEqual(firstDropIndex, -1, "First Drop must remain an anchor");
  assert.equal(
    ids[firstDropIndex + 1],
    "scene-1",
    "the next gesture after First Drop must complete fusion and zoom",
  );
  assert.doesNotMatch(
    anchorBlock,
    /id:\s*"fusion"/,
    "fusion is an animation phase, not a separate assisted-scroll stop",
  );
  assert.match(
    anchorBlock,
    /id:\s*"scene-1"[\s\S]*?transitionMs:\s*4000/,
    "the combined transition needs enough time for fusion, zoom, and crossfade",
  );
});
