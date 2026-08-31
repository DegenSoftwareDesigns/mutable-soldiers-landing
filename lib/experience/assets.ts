import type {
  ExperienceAspectBucket,
  ExperienceDevice,
  ExperienceProfile,
} from "./profile";

export type AssetKey = "ambient" | "packA" | "packB" | "cinematic";

export type ExperienceAsset = {
  key: AssetKey;
  kind: "video" | "model";
  src: string;
  critical: boolean;
  label: string;
  width?: number;
  height?: number;
  poster?: string;
  focalPoint?: readonly [x: number, y: number];
  safeArea?: readonly [top: number, right: number, bottom: number, left: number];
};

export type ExperienceAssetSet = {
  id: string;
  device: ExperienceDevice;
  aspectBucket: ExperienceAspectBucket;
  targetRatio: string;
  usesDesktopFallbacks: boolean;
  assets: Record<AssetKey, ExperienceAsset>;
};

export const experienceAssets: readonly ExperienceAsset[] = [
  {
    key: "ambient",
    kind: "video",
    src: "/assets/bg-video-16-9.webm",
    critical: true,
    label: "Ambient background",
    width: 2560,
    height: 1440,
    focalPoint: [0.5, 0.5],
    safeArea: [0.08, 0.08, 0.08, 0.08],
  },
  {
    key: "packA",
    kind: "model",
    src:
      process.env.NEXT_PUBLIC_PACK_GREEN_URL ??
      "/assets/mutable-pack-green-web.glb",
    critical: true,
    label: "Green Mutable Pack GLB",
  },
  {
    key: "packB",
    kind: "model",
    src:
      process.env.NEXT_PUBLIC_PACK_PURPLE_URL ??
      "/assets/mutable-pack-purple-web.glb",
    critical: true,
    label: "Purple Mutable Pack GLB",
  },
  {
    key: "cinematic",
    kind: "video",
    src: "/assets/scenes-cinematic.mp4",
    critical: false,
    label: "Cinematic sequence",
    width: 2560,
    height: 1440,
    focalPoint: [0.5, 0.5],
    safeArea: [0.1, 0.08, 0.1, 0.08],
  },
] as const;

export const assetByKey = Object.fromEntries(
  experienceAssets.map((asset) => [asset.key, asset]),
) as Record<AssetKey, ExperienceAsset>;

function targetRatioForProfile(profile: ExperienceProfile) {
  if (profile.orientation === "landscape") return "16:9";
  if (profile.device === "tablet") return "3:4";
  if (profile.device === "mobile") {
    return profile.aspectBucket === "portrait-tall" ? "9:19.5" : "9:16";
  }
  return "16:9";
}

export function selectExperienceAssets(
  profile: ExperienceProfile,
): ExperienceAssetSet {
  return {
    id: `${profile.device}-${profile.aspectBucket}`,
    device: profile.device,
    aspectBucket: profile.aspectBucket,
    targetRatio: targetRatioForProfile(profile),
    usesDesktopFallbacks:
      profile.device !== "desktop" || profile.aspectBucket === "landscape-wide",
    assets: assetByKey,
  };
}
