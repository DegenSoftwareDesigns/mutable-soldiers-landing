"use client";

import { useEffect, useRef, useState } from "react";
import { assetByKey } from "@/lib/experience/assets";
import {
  clamp01,
  cinematicScenes,
  experienceTuning,
  layerTransitions,
  rangeProgress,
  smoothstep,
  verifiedMedia,
} from "@/lib/experience/config";

type AmbientVideoProps = {
  progressRef: React.MutableRefObject<number>;
  onSettled: (available: boolean) => void;
};

export function AmbientVideo({ progressRef, onSettled }: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const settledRef = useRef(false);
  const settle = (available: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled(available);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      settle(true);
    }
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let shouldBePlaying = true;
    const syncPlayback = () => {
      const progress = progressRef.current;
      const nextShouldBePlaying =
        !document.hidden &&
        (progress < layerTransitions.webglToCinematic[1] ||
          progress >= layerTransitions.cinematicToAmbient[0]);

      if (nextShouldBePlaying === shouldBePlaying) return;
      shouldBePlaying = nextShouldBePlaying;
      if (shouldBePlaying) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    syncPlayback();
    const interval = window.setInterval(
      syncPlayback,
      experienceTuning.media.ambientStatePollMs,
    );
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [progressRef]);

  return (
    <div className="ambient-layer" data-layer="ambient">
      <div className="ambient-fallback" />
      <video
        ref={videoRef}
        className="ambient-video"
        src={assetByKey.ambient.src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={() => settle(true)}
        onError={() => settle(false)}
        aria-hidden="true"
      />
      <div className="ambient-vignette" />
    </div>
  );
}

type SceneDefinition = (typeof cinematicScenes)[number];

function opacityForWindow(
  progress: number,
  [start, end]: readonly [number, number],
) {
  const fade = layerTransitions.mediaCrossfade;
  const fadeIn = smoothstep(clamp01((progress - start) / fade));
  const fadeOut = 1 - smoothstep(clamp01((progress - (end - fade)) / fade));
  return Math.min(fadeIn, fadeOut);
}

type CinematicVideoLayerProps = {
  progressRef: React.MutableRefObject<number>;
  onStatusChange?: (status: Record<string, "loading" | "ready" | "missing">) => void;
};

export function CinematicVideoLayer({
  progressRef,
  onStatusChange,
}: CinematicVideoLayerProps) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const placeholderRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [status, setStatus] = useState<Record<string, "loading" | "ready" | "missing">>(
    () =>
      Object.fromEntries(
        cinematicScenes.map((scene) => [scene.key, "loading"]),
      ),
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    setStatus((current) => {
      const next = { ...current };
      let changed = false;
      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_METADATA &&
          current[scene.key] !== "ready"
        ) {
          next[scene.key] = "ready";
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    let frame = 0;
    let disposed = false;
    let lastScrubAt = 0;
    let loadedSceneIndexes = new Set<number>();
    const scrubIntervalMs = 1000 / experienceTuning.media.scrubFps;

    const sceneIndexesForProgress = (progress: number) => {
      if (progress < cinematicScenes[0].scrubRange[0]) return new Set([0]);

      let currentIndex = 0;
      cinematicScenes.forEach((scene, index) => {
        if (progress >= scene.scrubRange[0]) currentIndex = index;
      });

      return new Set(
        [currentIndex, currentIndex + 1].filter(
          (index) => index < cinematicScenes.length,
        ),
      );
    };

    const syncLoadedScenes = (progress: number) => {
      const nextLoadedSceneIndexes = sceneIndexesForProgress(progress);
      const unchanged =
        nextLoadedSceneIndexes.size === loadedSceneIndexes.size &&
        [...nextLoadedSceneIndexes].every((index) =>
          loadedSceneIndexes.has(index),
        );
      if (unchanged) return;

      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        if (!video) return;
        const shouldLoad = nextLoadedSceneIndexes.has(index);

        if (shouldLoad && !video.getAttribute("src")) {
          video.src = assetByKey[scene.key].src;
          video.preload =
            index === Math.min(...nextLoadedSceneIndexes) ? "auto" : "metadata";
          video.load();
        } else if (!shouldLoad && video.getAttribute("src")) {
          video.pause();
          video.removeAttribute("src");
          video.load();
          setStatus((current) =>
            current[scene.key] === "loading"
              ? current
              : { ...current, [scene.key]: "loading" },
          );
        }
      });

      loadedSceneIndexes = nextLoadedSceneIndexes;
    };

    const update = (timestamp: number) => {
      if (disposed) return;
      const progress = progressRef.current;
      syncLoadedScenes(progress);
      const shouldScrub = timestamp - lastScrubAt >= scrubIntervalMs;

      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        const placeholder = placeholderRefs.current[index];
        const opacity = opacityForWindow(progress, scene.visibleRange);

        if (video) {
          const nextOpacity = String(opacity);
          if (video.style.opacity !== nextOpacity) video.style.opacity = nextOpacity;
          if (
            shouldScrub &&
            loadedSceneIndexes.has(index) &&
            video.readyState >= HTMLMediaElement.HAVE_METADATA &&
            video.duration > 0
          ) {
            const rawTargetTime =
              rangeProgress(progress, scene.scrubRange) *
              Math.max(0, video.duration - 0.001);
            const targetTime =
              Math.round(rawTargetTime * experienceTuning.media.scrubFps) /
              experienceTuning.media.scrubFps;
            if (
              Math.abs(video.currentTime - targetTime) >
              verifiedMedia.cinematic.seekEpsilonSeconds
            ) {
              video.currentTime = targetTime;
            }
          }
        }

        if (placeholder) {
          placeholder.style.opacity =
            statusRef.current[scene.key] === "missing" ? String(opacity) : "0";
        }
      });

      if (shouldScrub) lastScrubAt = timestamp;

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, [progressRef]);

  const updateStatus = (
    key: SceneDefinition["key"],
    next: "ready" | "missing",
  ) => setStatus((current) => (current[key] === next ? current : { ...current, [key]: next }));

  return (
    <div className="cinematic-layer" data-layer="cinematic" aria-hidden="true">
      {cinematicScenes.map((scene, index) => (
        <div className="cinematic-slot" key={scene.key}>
          <video
            ref={(node) => {
              videoRefs.current[index] = node;
            }}
            className="cinematic-video"
            muted
            playsInline
            preload="none"
            onLoadedMetadata={() => updateStatus(scene.key, "ready")}
            onError={() => updateStatus(scene.key, "missing")}
          />
          <div
            ref={(node) => {
              placeholderRefs.current[index] = node;
            }}
            className="cinematic-placeholder"
          >
            <span>Missing development asset</span>
            <strong>{scene.label}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
