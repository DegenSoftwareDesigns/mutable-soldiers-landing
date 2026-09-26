export type ProgressRange = readonly [start: number, end: number];

export type StoryChapter = {
  id: string;
  label: string;
  range: ProgressRange;
};

export const storyChapters: readonly StoryChapter[] = [
  { id: "hero", label: "Hero", range: [0, 0.08] },
  { id: "reposition", label: "Pack repositioning", range: [0.08, 0.15] },
  { id: "two-paths", label: "Two Packs. Two Paths.", range: [0.15, 0.24] },
  { id: "first-drop", label: "First Drop Reveal", range: [0.24, 0.33] },
  { id: "fusion", label: "Fusion and glow", range: [0.33, 0.43] },
  { id: "zoom", label: "Maximum zoom", range: [0.43, 0.5] },
  { id: "cinematic-opening", label: "Cinematic opening", range: [0.5, 0.62] },
  { id: "classes", label: "Classes", range: [0.62, 0.66] },
  { id: "cinematic-classes", label: "Cinematic after Classes", range: [0.66, 0.73] },
  { id: "rarities", label: "Rarities", range: [0.73, 0.77] },
  { id: "cinematic-rarities", label: "Cinematic after Rarities", range: [0.77, 0.84] },
  { id: "artists", label: "Featured Artists", range: [0.84, 0.88] },
  { id: "cinematic-finale", label: "Cinematic finale", range: [0.88, 0.94] },
  { id: "final", label: "Ambient return and CTA", range: [0.94, 0.97] },
  { id: "footer", label: "Footer", range: [0.97, 1] },
] as const;

export const uiWindows = {
  hero: [0, 0.08],
  twoPaths: [0.155, 0.235],
  firstDrop: [0.245, 0.325],
  classes: [0.622, 0.658],
  rarities: [0.732, 0.768],
  artists: [0.842, 0.878],
  final: [0.94, 0.97],
  footer: [0.97, 1],
} as const satisfies Record<string, ProgressRange>;

const cinematicFps = 30;
const timeAtFrame = (seconds: number, frame: number) =>
  seconds + frame / cinematicFps;

export const cinematicSegments = [
  {
    id: "opening",
    scrollRange: [0.5, 0.62],
    timeRange: [0, timeAtFrame(3, 19)],
  },
  {
    id: "after-classes",
    scrollRange: [0.66, 0.73],
    timeRange: [timeAtFrame(3, 19), timeAtFrame(6, 19)],
  },
  {
    id: "after-rarities",
    scrollRange: [0.77, 0.84],
    timeRange: [timeAtFrame(6, 19), timeAtFrame(10, 18)],
  },
  {
    id: "finale",
    scrollRange: [0.88, 0.94],
    timeRange: [timeAtFrame(10, 18), timeAtFrame(12, 3)],
  },
] as const satisfies readonly {
  id: string;
  scrollRange: ProgressRange;
  timeRange: ProgressRange;
}[];

export const verifiedMedia = {
  ambient: {
    filename: "bg-video-16-9.webm",
    codec: "AV1",
    width: 2560,
    height: 1440,
    fps: 30,
    durationSeconds: 12,
    keyframeIntervalSeconds: 5.37,
  },
  cinematic: {
    filename: "scenes-cinematic.mp4",
    codec: "H264",
    width: 2560,
    height: 1440,
    fps: cinematicFps,
    durationSeconds: 12.1,
    lastFrameSeconds: timeAtFrame(12, 3),
    keyframeIntervalSeconds: 0.5,
    seekEpsilonSeconds: 1 / 60,
  },
} as const;

export const layerTransitions = {
  webglToCinematic: [0.48, 0.5],
  cinematicToAmbient: [0.94, 0.97],
  uiTransition: 0.012,
} as const satisfies {
  webglToCinematic: ProgressRange;
  cinematicToAmbient: ProgressRange;
  uiTransition: number;
};

export const packMotion = {
  ranges: {
    reposition: [0.08, 0.15],
    pulseIn: [0.145, 0.17],
    permutation: [0.235, 0.285],
    depthHandoff: [0.285, 0.33],
    pulseOut: [0.35, 0.4],
    fusion: [0.33, 0.43],
    zoom: [0.43, 0.5],
    greenMergeFade: [0.39, 0.43],
    webglFade: [0.485, 0.5],
    finalReveal: [0.94, 0.985],
  },
  hero: {
    greenX: 0.52,
    purpleX: 1.78,
    greenZ: 0.2,
    purpleZ: -0.2,
    scale: 0.9,
  },
  spread: {
    greenX: 1.08,
    purpleX: -1.08,
    greenZ: 0.16,
    purpleZ: -0.16,
    scale: 1.12,
  },
  permutation: {
    greenX: -1.08,
    purpleX: 1.08,
    greenZ: -0.2,
    purpleZ: 0.24,
    arcY: 0.3,
    roll: 0.075,
  },
  fusion: {
    scale: 1.28,
    zoomScale: 6.8,
    zoomZ: 3.4,
    greenZ: -0.2,
    purpleZ: 0.28,
    neutralBlend: 0.58,
  },
  glow: {
    base: 0.12,
    pulseAmplitude: 1,
    fusionGain: 1.55,
    pulseSpeed: 5.2,
    scaleAmplitude: 0.026,
  },
  interaction: {
    maxOffset: 0.86,
    followDamping: 28,
    returnDamping: 5.5,
    tiltFollowDamping: 24,
    tiltReturnDamping: 7,
    gestureMemoryDamping: 11,
    energyAttackDamping: 18,
    energyReleaseDamping: 5.5,
    speedForMaxGlow: 1400,
    maxTiltX: 0.12,
    maxTiltZ: 0.18,
    emissiveBoost: 2.25,
    accentLightBoost: 5.5,
    reducedMotionTiltScale: 0.2,
  },
  glitch: {
    energyThreshold: 0.6,
    chargeSeconds: 2.2,
    chargeDecay: 0.45,
    fadeInSeconds: 0.12,
    releaseFadeSeconds: 0.4,
    cooldown: 1.2,
    hueCyclesPerSecond: 1.6,
    saturationBoost: 0.25,
    emissiveFlicker: 3.2,
    jumpInterval: 0.07,
    jumpOffset: 0.16,
    jumpRotation: 0.22,
    jumpScale: 0.12,
    rgbSplitPx: 9,
    shakePx: 10,
    previewJitter: 0.035,
    viewportDelaySeconds: 2,
    viewportFadeInSeconds: 0.35,
    viewportStepSeconds: 0.06,
    viewportTearPx: 70,
    viewportRgbSplitPx: 7,
    viewportHueDegreesPerSecond: 220,
    viewportLabelDelay: 1.2,
    terrorDelaySeconds: 2,
    terrorSrc: "/assets/halloween-easter-egg.png",
    terrorOpacityLevels: [0, 0.2, 0.5, 0.8, 1, 1],
    terrorHoldChance: 0.35,
    terrorScaleJitter: 0.05,
  },
  final: {
    greenX: -1.08,
    purpleX: 1.08,
    greenY: -0.04,
    purpleY: 0.05,
    purpleZ: -0.08,
    scaleFrom: 0.88,
    scaleTo: 1.08,
    greenRotation: [0.02, -0.12, -0.08],
    purpleRotation: [-0.01, 0.1, 0.08],
    hoverAmplitude: 0.03,
    greenHoverSpeed: 0.55,
    purpleHoverSpeed: 0.48,
    emissiveIntensity: 0.85,
  },
  presentation: {
    greenY: 0.03,
    purpleY: -0.02,
    greenRotation: [0.015, -0.12, -0.06],
    purpleRotation: [-0.01, 0.1, 0.07],
    hoverAmplitude: 0.025,
    greenHoverSpeed: 0.55,
    purpleHoverSpeed: 0.5,
    floatYAmplitude: 0.055,
    floatZAmplitude: 0.035,
    greenFloatSpeed: 0.72,
    purpleFloatSpeed: 0.63,
  },
} as const;

export const uiMotion = {
  enterY: 38,
  enterZ: -620,
  enterScale: 0.72,
  enterRotationX: 68,
  enterRotationY: 28,
  exitY: -18,
  exitZ: 520,
  exitScale: 1.22,
  exitRotationX: -7,
  exitRotationY: 5,
  heroExitY: -16,
  heroExitZ: 480,
  heroExitScale: 1.18,
  heroExitRotationX: -6,
  heroExitRotationY: -5,
} as const;

export const experienceTuning = {
  scrollLengthVh: 1500,
  maxDpr: 1.5,
  media: {
    scrubFps: 30,
    cinematicPreloadThreshold: 0.15,
  },
  camera: {
    fov: 35,
    near: 0.1,
    far: 100,
    designZ: 7.2,
  },
  lighting: {
    exposure: 0.88,
    hemisphereIntensity: 0.78,
    keyIntensity: 2.1,
    fillIntensity: 0.95,
    rimIntensity: 8,
    rimPulseAmplitude: 1.2,
    rimPulseSpeed: 1.2,
    greenAccentIntensity: 4.2,
    purpleAccentIntensity: 4.4,
    fusionSilverIntensity: 3.2,
  },
  smoothScroll: {
    duration: 1.08,
    wheelMultiplier: 0.9,
  },
  loaderTimeoutMs: 6500,
} as const;

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function rangeProgress(progress: number, range: ProgressRange) {
  const [start, end] = range;
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export function cinematicTimeForProgress(progress: number) {
  for (const segment of cinematicSegments) {
    const [scrollStart, scrollEnd] = segment.scrollRange;
    const [timeStart, timeEnd] = segment.timeRange;
    if (progress <= scrollStart) return timeStart;
    if (progress <= scrollEnd) {
      return (
        timeStart +
        rangeProgress(progress, segment.scrollRange) * (timeEnd - timeStart)
      );
    }
  }

  return cinematicSegments[cinematicSegments.length - 1].timeRange[1];
}

export function smoothstep(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function currentChapter(progress: number) {
  return (
    storyChapters.find(
      (chapter) => progress >= chapter.range[0] && progress < chapter.range[1],
    ) ?? storyChapters[storyChapters.length - 1]
  );
}
