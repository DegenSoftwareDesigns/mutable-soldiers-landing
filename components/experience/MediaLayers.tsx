"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { ExperienceProgressSignal } from "@/lib/experience/progress";

type AmbientVideoProps = {
  progressSignal: ExperienceProgressSignal;
  onSettled: (available: boolean) => void;
};

export function AmbientVideo({
  progressSignal,
  onSettled,
}: AmbientVideoProps) {
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

    let shouldBePlaying: boolean | null = null;
    const syncPlayback = (progress: number) => {
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

    const unsubscribe = progressSignal.subscribe(syncPlayback);
    const onVisibilityChange = () => syncPlayback(progressSignal.get());
    syncPlayback(progressSignal.get());
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [progressSignal]);

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
type SceneStatus = "loading" | "ready" | "missing";
type SceneLoadMode = "metadata" | "auto";

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
  progressSignal: ExperienceProgressSignal;
  onStatusChange?: (status: Record<string, SceneStatus>) => void;
};

export function CinematicVideoLayer({
  progressSignal,
  onStatusChange,
}: CinematicVideoLayerProps) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const placeholderRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [status, setStatus] = useState<Record<string, SceneStatus>>(() =>
    Object.fromEntries(
      cinematicScenes.map((scene) => [scene.key, "loading"]),
    ),
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  const updateStatus = useCallback(
    (key: SceneDefinition["key"], next: SceneStatus) =>
      setStatus((current) =>
        current[key] === next ? current : { ...current, [key]: next },
      ),
    [],
  );

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    let lastScrubAt = 0;
    let scrubTimer = 0;
    let latestProgress = progressSignal.get();
    let direction: 1 | -1 = 1;
    let loadedSceneIndexes = new Set<number>();
    let loadModes = new Map<number, SceneLoadMode>();
    const pendingTargetTimes = new Map<number, number>();
    const scrubIntervalMs = 1000 / experienceTuning.media.scrubFps;

    const loadPlanForProgress = (
      progress: number,
      previousProgress: number,
    ) => {
      if (progress > previousProgress + 0.0001) direction = 1;
      if (progress < previousProgress - 0.0001) direction = -1;

      if (
        progress < experienceTuning.media.firstSceneMetadataPreloadProgress
      ) {
        return new Map<number, SceneLoadMode>();
      }

      const visibleIndexes = cinematicScenes
        .map((scene, index) => ({
          index,
          opacity: opacityForWindow(progress, scene.visibleRange),
        }))
        .filter(({ opacity }) => opacity > 0.001);
      const primaryIndex = visibleIndexes.length
        ? visibleIndexes.reduce((current, candidate) =>
            candidate.opacity > current.opacity ? candidate : current,
          ).index
        : progress < cinematicScenes[0].visibleRange[0]
          ? 0
          : cinematicScenes.length - 1;
      const indexes = new Set(visibleIndexes.map(({ index }) => index));
      indexes.add(primaryIndex);

      const insideCinematicSequence =
        progress >= cinematicScenes[0].visibleRange[0] &&
        progress <= cinematicScenes[cinematicScenes.length - 1].visibleRange[1];
      if (insideCinematicSequence && indexes.size < 2) {
        const directionalNeighbor = primaryIndex + direction;
        if (
          directionalNeighbor >= 0 &&
          directionalNeighbor < cinematicScenes.length
        ) {
          indexes.add(directionalNeighbor);
        }
      }

      const modes = new Map<number, SceneLoadMode>();
      indexes.forEach((index) => {
        const firstSceneBeforeReveal =
          index === 0 && progress < cinematicScenes[0].visibleRange[0];
        modes.set(
          index,
          firstSceneBeforeReveal &&
            progress < experienceTuning.media.firstSceneAutoPreloadProgress
            ? "metadata"
            : "auto",
        );
      });
      return modes;
    };

    const syncLoadedScenes = (progress: number, previousProgress: number) => {
      const nextLoadModes = loadPlanForProgress(progress, previousProgress);
      const nextLoadedSceneIndexes = new Set(nextLoadModes.keys());
      const unchanged =
        nextLoadedSceneIndexes.size === loadedSceneIndexes.size &&
        [...nextLoadedSceneIndexes].every((index) =>
          loadedSceneIndexes.has(index) &&
          loadModes.get(index) === nextLoadModes.get(index),
        );
      if (unchanged) return;

      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        if (!video) return;
        const desiredMode = nextLoadModes.get(index);

        if (desiredMode && !video.getAttribute("src")) {
          video.preload = desiredMode;
          video.src = assetByKey[scene.key].src;
          video.dataset.loaded = "true";
          updateStatus(scene.key, "loading");
          video.load();
        } else if (desiredMode && video.preload !== desiredMode) {
          video.preload = desiredMode;
          updateStatus(scene.key, "loading");
          if (desiredMode === "auto") video.load();
        } else if (!desiredMode && video.getAttribute("src")) {
          video.pause();
          video.removeAttribute("src");
          video.preload = "none";
          delete video.dataset.loaded;
          pendingTargetTimes.delete(index);
          video.load();
          updateStatus(scene.key, "loading");
        }
      });

      loadedSceneIndexes = nextLoadedSceneIndexes;
      loadModes = nextLoadModes;
    };

    const updateOpacities = (progress: number) => {
      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        const placeholder = placeholderRefs.current[index];
        const opacity = opacityForWindow(progress, scene.visibleRange);
        if (video) {
          const nextOpacity = String(opacity);
          if (video.style.opacity !== nextOpacity) video.style.opacity = nextOpacity;
        }
        if (placeholder) {
          const nextPlaceholderOpacity =
            statusRef.current[scene.key] === "missing"
              ? String(opacity)
              : "0";
          if (placeholder.style.opacity !== nextPlaceholderOpacity) {
            placeholder.style.opacity = nextPlaceholderOpacity;
          }
        }
      });
    };

    const flushSeek = (index: number) => {
      const video = videoRefs.current[index];
      const targetTime = pendingTargetTimes.get(index);
      if (
        !video ||
        targetTime === undefined ||
        video.seeking ||
        video.readyState < HTMLMediaElement.HAVE_METADATA ||
        video.duration <= 0
      ) {
        return;
      }

      if (
        Math.abs(video.currentTime - targetTime) <=
        verifiedMedia.cinematic.seekEpsilonSeconds
      ) {
        pendingTargetTimes.delete(index);
        return;
      }

      video.currentTime = targetTime;
    };

    const scrubVideos = (progress: number) => {
      loadedSceneIndexes.forEach((index) => {
        const scene = cinematicScenes[index];
        const video = videoRefs.current[index];
        if (!video || video.duration <= 0) return;
        const rawTargetTime =
          rangeProgress(progress, scene.scrubRange) *
          Math.max(0, video.duration - 0.001);
        const targetTime =
          Math.round(rawTargetTime * experienceTuning.media.scrubFps) /
          experienceTuning.media.scrubFps;
        pendingTargetTimes.set(index, targetTime);
        flushSeek(index);
      });
    };

    const scheduleScrub = (progress: number) => {
      latestProgress = progress;
      const now = performance.now();
      const remaining = scrubIntervalMs - (now - lastScrubAt);
      if (remaining <= 0) {
        window.clearTimeout(scrubTimer);
        scrubTimer = 0;
        lastScrubAt = now;
        scrubVideos(latestProgress);
        return;
      }

      if (scrubTimer) return;
      scrubTimer = window.setTimeout(() => {
        scrubTimer = 0;
        lastScrubAt = performance.now();
        scrubVideos(latestProgress);
      }, remaining);
    };

    const listenerCleanups = cinematicScenes.map((scene, index) => {
      const video = videoRefs.current[index];
      if (!video) return () => undefined;
      const onLoadedData = () => {
        updateStatus(scene.key, "ready");
        scheduleScrub(latestProgress);
      };
      const onSeeked = () => flushSeek(index);
      const onError = () => updateStatus(scene.key, "missing");
      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onError);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        updateStatus(scene.key, "ready");
      }
      return () => {
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
      };
    });

    const syncProgress = (progress: number, previousProgress: number) => {
      latestProgress = progress;
      syncLoadedScenes(progress, previousProgress);
      updateOpacities(progress);
      scheduleScrub(progress);
    };

    const unsubscribe = progressSignal.subscribe(syncProgress);
    syncProgress(latestProgress, latestProgress);

    return () => {
      unsubscribe();
      window.clearTimeout(scrubTimer);
      listenerCleanups.forEach((cleanup) => cleanup());
    };
  }, [progressSignal, updateStatus]);

  useEffect(() => {
    const progress = progressSignal.get();
    cinematicScenes.forEach((scene, index) => {
      const placeholder = placeholderRefs.current[index];
      if (!placeholder) return;
      const nextOpacity =
        status[scene.key] === "missing"
          ? String(opacityForWindow(progress, scene.visibleRange))
          : "0";
      if (placeholder.style.opacity !== nextOpacity) {
        placeholder.style.opacity = nextOpacity;
      }
    });
  }, [progressSignal, status]);

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
