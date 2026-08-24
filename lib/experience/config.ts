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
  { id: "scene-1", label: "scene-1", range: [0.5, 0.62] },
  { id: "classes", label: "Classes", range: [0.62, 0.66] },
  { id: "scene-2", label: "scene-2", range: [0.66, 0.73] },
  { id: "rarities", label: "Rarities", range: [0.73, 0.77] },
  { id: "scene-3", label: "scene-3", range: [0.77, 0.84] },
  { id: "artists", label: "Featured Artists", range: [0.84, 0.88] },
  { id: "scene-4", label: "scene-4", range: [0.88, 0.94] },
  { id: "final", label: "Ambient return and CTA", range: [0.94, 1] },
] as const;

export const uiWindows = {
  hero: [0, 0.08],
  twoPaths: [0.155, 0.235],
  firstDrop: [0.245, 0.325],
  classes: [0.622, 0.658],
  rarities: [0.732, 0.768],
  artists: [0.842, 0.878],
  final: [0.952, 1],
} as const satisfies Record<string, ProgressRange>;

export const cinematicScenes = [
  {
    key: "scene1",
    label: "scene-1-web.webm",
    scrubRange: [0.5, 0.62],
    visibleRange: [0.488, 0.624],
    durationSeconds: 4.966,
    codec: "VP9",
  },
  {
    key: "scene2",
    label: "scene-2-web.webm",
    scrubRange: [0.66, 0.73],
    visibleRange: [0.616, 0.734],
    durationSeconds: 5.966,
    codec: "VP9",
  },
  {
    key: "scene3",
    label: "scene-3-web.webm",
    scrubRange: [0.77, 0.84],
    visibleRange: [0.726, 0.844],
    durationSeconds: 7.933,
    codec: "VP9",
  },
  {
    key: "scene4",
    label: "scene-4-web.webm",
    scrubRange: [0.88, 0.94],
    visibleRange: [0.836, 0.952],
    durationSeconds: 4.966,
    codec: "VP9",
  },
] as const;

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
    width: 2560,
    height: 1440,
    fps: 30,
    keyframeIntervalSeconds: 1 / 30,
    seekEpsilonSeconds: 1 / 60,
  },
} as const;

export const layerTransitions = {
  webglToCinematic: [0.48, 0.5],
  cinematicToAmbient: [0.94, 0.97],
  mediaCrossfade: 0.008,
  uiTransition: 0.012,
} as const satisfies {
  webglToCinematic: ProgressRange;
  cinematicToAmbient: ProgressRange;
  mediaCrossfade: number;
  uiTransition: number;
};

export const packMotion = {
  ranges: {
    reposition: [0.08, 0.15],
    pulseIn: [0.24, 0.28],
    pulseOut: [0.35, 0.4],
    fusion: [0.33, 0.43],
    zoom: [0.43, 0.5],
    purpleMergeFade: [0.39, 0.43],
    webglFade: [0.485, 0.5],
    finalReveal: [0.94, 0.985],
  },
  hero: {
    greenX: 0.52,
    purpleX: 1.78,
    scale: 0.9,
  },
  spread: {
    greenX: -1.08,
    purpleX: 1.08,
    scale: 1.12,
  },
  fusion: {
    scale: 1.28,
    zoomScale: 6.8,
    zoomZ: 3.4,
  },
  glow: {
    base: 0.12,
    pulseAmplitude: 1,
    fusionGain: 3.8,
    pulseSpeed: 4.2,
  },
  final: {
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
  },
} as const;

export const uiMotion = {
  enterY: 46,
  enterScale: 0.97,
  exitY: -34,
  exitScale: 0.985,
  heroExitY: -30,
  heroExitScale: 0.84,
  scrollScrub: 0.35,
} as const;

export const experienceTuning = {
  scrollLengthVh: 1500,
  maxDpr: 1.75,
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
