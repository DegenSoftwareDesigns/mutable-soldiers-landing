import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyExperienceProfile,
  profileSelectionChanged,
} from "../lib/experience/profile.ts";
import { selectExperienceAssets } from "../lib/experience/assets.ts";

const profile = (overrides) =>
  classifyExperienceProfile({
    width: 1440,
    height: 900,
    devicePixelRatio: 1,
    coarsePointer: false,
    hoverNone: false,
    maxTouchPoints: 0,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    ...overrides,
  });

test("classifies reference mobile and tablet portrait viewports", () => {
  const mobile = profile({
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });
  const tablet = profile({
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });

  assert.equal(mobile.device, "mobile");
  assert.equal(mobile.aspectBucket, "portrait-tall");
  assert.equal(mobile.physicalWidth, 1170);
  assert.equal(tablet.device, "tablet");
  assert.equal(tablet.aspectBucket, "portrait-standard");
});

test("classifies tablet landscape, desktop, ultrawide, and touch laptops", () => {
  const tabletLandscape = profile({
    width: 1024,
    height: 768,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });
  const desktop = profile({ width: 1440, height: 900 });
  const ultrawide = profile({ width: 2560, height: 1080 });
  const touchLaptop = profile({
    width: 1366,
    height: 768,
    coarsePointer: false,
    hoverNone: false,
    maxTouchPoints: 10,
  });

  assert.equal(tabletLandscape.device, "tablet");
  assert.equal(tabletLandscape.aspectBucket, "landscape-standard");
  assert.equal(desktop.device, "desktop");
  assert.equal(ultrawide.aspectBucket, "landscape-wide");
  assert.equal(touchLaptop.device, "desktop");
  assert.equal(touchLaptop.inputMode, "fine");
});

test("uses a low quality tier for constrained hardware", () => {
  assert.equal(profile({ saveData: true }).quality, "low");
  assert.equal(profile({ deviceMemory: 4 }).quality, "low");
  assert.equal(profile({ hardwareConcurrency: 4 }).quality, "low");
});

test("selects deterministic target ratios while keeping desktop fallbacks", () => {
  const mobileTall = profile({
    width: 390,
    height: 844,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });
  const tablet = profile({
    width: 768,
    height: 1024,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });
  const mobileLandscape = profile({
    width: 844,
    height: 390,
    coarsePointer: true,
    hoverNone: true,
    maxTouchPoints: 5,
  });

  assert.equal(selectExperienceAssets(mobileTall).targetRatio, "9:19.5");
  assert.equal(selectExperienceAssets(tablet).targetRatio, "3:4");
  assert.equal(selectExperienceAssets(mobileLandscape).targetRatio, "16:9");
  assert.equal(selectExperienceAssets(tablet).usesDesktopFallbacks, true);
});

test("only treats device, orientation, or aspect bucket changes as reload-worthy", () => {
  const loaded = profile({ width: 390, height: 844, deviceOverride: "mobile" });
  const browserChromeResize = profile({
    width: 390,
    height: 820,
    deviceOverride: "mobile",
  });
  const rotated = profile({
    width: 844,
    height: 390,
    deviceOverride: "mobile",
  });

  assert.equal(profileSelectionChanged(loaded, browserChromeResize), false);
  assert.equal(profileSelectionChanged(loaded, rotated), true);
});
