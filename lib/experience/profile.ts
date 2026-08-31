export type ExperienceDevice = "desktop" | "tablet" | "mobile";
export type ExperienceOrientation = "portrait" | "landscape";
export type ExperienceAspectBucket =
  | "portrait-tall"
  | "portrait-standard"
  | "near-square"
  | "landscape-standard"
  | "landscape-wide";
export type ExperienceInputMode = "fine" | "coarse";
export type ExperienceQuality = "low" | "balanced" | "high";

export type ExperienceProfile = {
  device: ExperienceDevice;
  orientation: ExperienceOrientation;
  aspectBucket: ExperienceAspectBucket;
  inputMode: ExperienceInputMode;
  quality: ExperienceQuality;
  viewportWidth: number;
  viewportHeight: number;
  physicalWidth: number;
  physicalHeight: number;
  devicePixelRatio: number;
  aspectRatio: number;
  reducedMotion: boolean;
  saveData: boolean;
  key: string;
};

export type ExperienceProfileInput = {
  width: number;
  height: number;
  devicePixelRatio?: number;
  coarsePointer?: boolean;
  hoverNone?: boolean;
  maxTouchPoints?: number;
  mobileHint?: boolean;
  reducedMotion?: boolean;
  saveData?: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  deviceOverride?: ExperienceDevice;
};

const MOBILE_SHORT_SIDE_MAX = 599;
const EXTREME_ASPECT_RATIO = 1.9;
const NEAR_SQUARE_RATIO = 1.2;

function normalizeDimension(value: number) {
  return Math.max(1, Math.round(value));
}

export function classifyAspectBucket(
  width: number,
  height: number,
): ExperienceAspectBucket {
  const normalizedWidth = normalizeDimension(width);
  const normalizedHeight = normalizeDimension(height);
  const longToShort =
    Math.max(normalizedWidth, normalizedHeight) /
    Math.min(normalizedWidth, normalizedHeight);

  if (longToShort < NEAR_SQUARE_RATIO) return "near-square";
  if (normalizedHeight >= normalizedWidth) {
    return longToShort >= EXTREME_ASPECT_RATIO
      ? "portrait-tall"
      : "portrait-standard";
  }
  return longToShort >= EXTREME_ASPECT_RATIO
    ? "landscape-wide"
    : "landscape-standard";
}

export function classifyExperienceProfile(
  input: ExperienceProfileInput,
): ExperienceProfile {
  const viewportWidth = normalizeDimension(input.width);
  const viewportHeight = normalizeDimension(input.height);
  const devicePixelRatio = Math.max(1, input.devicePixelRatio ?? 1);
  const shortSide = Math.min(viewportWidth, viewportHeight);
  const touchFirst =
    Boolean(input.mobileHint) ||
    ((input.maxTouchPoints ?? 0) > 0 &&
      (Boolean(input.coarsePointer) || Boolean(input.hoverNone)));
  const device =
    input.deviceOverride ??
    (touchFirst
      ? shortSide <= MOBILE_SHORT_SIDE_MAX
        ? "mobile"
        : "tablet"
      : "desktop");
  const inputMode = touchFirst ? "coarse" : "fine";
  const constrainedHardware =
    Boolean(input.saveData) ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 4) ||
    (input.hardwareConcurrency !== undefined && input.hardwareConcurrency <= 4);
  const quality: ExperienceQuality = constrainedHardware
    ? "low"
    : device === "desktop"
      ? "high"
      : "balanced";
  const orientation: ExperienceOrientation =
    viewportHeight >= viewportWidth ? "portrait" : "landscape";
  const aspectBucket = classifyAspectBucket(viewportWidth, viewportHeight);

  return {
    device,
    orientation,
    aspectBucket,
    inputMode,
    quality,
    viewportWidth,
    viewportHeight,
    physicalWidth: Math.round(viewportWidth * devicePixelRatio),
    physicalHeight: Math.round(viewportHeight * devicePixelRatio),
    devicePixelRatio,
    aspectRatio: viewportWidth / viewportHeight,
    reducedMotion: Boolean(input.reducedMotion),
    saveData: Boolean(input.saveData),
    key: `${device}:${orientation}:${aspectBucket}:${quality}`,
  };
}

type BrowserNavigator = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
  userAgentData?: { mobile?: boolean };
};

export function detectExperienceProfile(
  deviceOverride?: ExperienceDevice,
): ExperienceProfile {
  const viewport = window.visualViewport;
  const browserNavigator = navigator as BrowserNavigator;

  return classifyExperienceProfile({
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    hoverNone: window.matchMedia("(hover: none)").matches,
    maxTouchPoints: navigator.maxTouchPoints,
    mobileHint: browserNavigator.userAgentData?.mobile,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: browserNavigator.connection?.saveData,
    deviceMemory: browserNavigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceOverride,
  });
}

export function profileSelectionChanged(
  loaded: ExperienceProfile,
  current: ExperienceProfile,
) {
  return (
    loaded.device !== current.device ||
    loaded.orientation !== current.orientation ||
    loaded.aspectBucket !== current.aspectBucket
  );
}

export function maxDprForProfile(profile: ExperienceProfile) {
  if (profile.quality === "low") return 1;
  if (profile.device === "mobile") return 1;
  if (profile.device === "tablet") return 1.25;
  return 1.5;
}

export function profileLabel(profile: ExperienceProfile) {
  return profile.device[0].toUpperCase() + profile.device.slice(1);
}
