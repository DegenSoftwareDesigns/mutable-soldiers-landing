export type AssetKey =
  | "ambient"
  | "packA"
  | "packB"
  | "cinematic";

export type ExperienceAsset = {
  key: AssetKey;
  kind: "video" | "model";
  src: string;
  critical: boolean;
  label: string;
};

export const experienceAssets: readonly ExperienceAsset[] = [
  {
    key: "ambient",
    kind: "video",
    src: "/assets/bg-video-16-9.webm",
    critical: true,
    label: "Ambient background",
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
    src: "/assets/scenes-h264-scroll.mp4",
    critical: false,
    label: "Cinematic sequence",
  },
] as const;

export const assetByKey = Object.fromEntries(
  experienceAssets.map((asset) => [asset.key, asset]),
) as Record<AssetKey, ExperienceAsset>;
