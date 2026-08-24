export type AssetKey =
  | "ambient"
  | "packA"
  | "packB"
  | "scene1"
  | "scene2"
  | "scene3"
  | "scene4";

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
    key: "scene1",
    kind: "video",
    src: "/assets/scene-1-web.webm",
    critical: false,
    label: "Cinematic scene 1",
  },
  {
    key: "scene2",
    kind: "video",
    src: "/assets/scene-2-web.webm",
    critical: false,
    label: "Cinematic scene 2",
  },
  {
    key: "scene3",
    kind: "video",
    src: "/assets/scene-3-web.webm",
    critical: false,
    label: "Cinematic scene 3",
  },
  {
    key: "scene4",
    kind: "video",
    src: "/assets/scene-4-web.webm",
    critical: false,
    label: "Cinematic scene 4",
  },
] as const;

export const assetByKey = Object.fromEntries(
  experienceAssets.map((asset) => [asset.key, asset]),
) as Record<AssetKey, ExperienceAsset>;
