"use client";

import { useEffect, useRef, useState } from "react";
import { assetByKey } from "@/lib/experience/assets";
import {
  cinematicTimeForProgress,
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

export type CinematicVideoStatus = "loading" | "ready" | "missing";

function cinematicOpacity(progress: number) {
  const fadeIn = smoothstep(
    rangeProgress(progress, layerTransitions.webglToCinematic),
  );
  const fadeOut = smoothstep(
    rangeProgress(progress, layerTransitions.cinematicToAmbient),
  );
  return fadeIn * (1 - fadeOut);
}

type CinematicVideoLayerProps = {
  progressSignal: ExperienceProgressSignal;
  onStatusChange?: (status: CinematicVideoStatus) => void;
  onPreloadThreshold?: () => void;
};

export function CinematicVideoLayer({
  progressSignal,
  onStatusChange,
  onPreloadThreshold,
}: CinematicVideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<CinematicVideoStatus>("loading");

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    const video = videoRef.current;
    const placeholder = placeholderRef.current;
    if (!video || !placeholder) return;

    let lastScrubAt = 0;
    let scrubTimer = 0;
    let latestProgress = progressSignal.get();
    let pendingTargetTime: number | null = null;
    let preloadThresholdReached = false;
    const scrubIntervalMs = 1000 / experienceTuning.media.scrubFps;

    const checkPreloadThreshold = () => {
      if (preloadThresholdReached || video.buffered.length === 0) return;
      if (video.duration <= 0 || !Number.isFinite(video.duration)) return;

      const bufferedRatio = video.buffered.end(0) / video.duration;
      if (bufferedRatio < experienceTuning.media.cinematicPreloadThreshold) {
        return;
      }

      preloadThresholdReached = true;
      onPreloadThreshold?.();
    };

    const flushSeek = () => {
      if (
        pendingTargetTime === null ||
        video.seeking ||
        video.readyState < HTMLMediaElement.HAVE_METADATA ||
        video.duration <= 0
      ) {
        return;
      }

      if (
        Math.abs(video.currentTime - pendingTargetTime) <=
        verifiedMedia.cinematic.seekEpsilonSeconds
      ) {
        pendingTargetTime = null;
        return;
      }

      const targetTime = pendingTargetTime;
      pendingTargetTime = null;
      video.currentTime = targetTime;
    };

    const scrubVideo = (progress: number) => {
      const targetTime = cinematicTimeForProgress(progress);
      pendingTargetTime =
        Math.round(targetTime * experienceTuning.media.scrubFps) /
        experienceTuning.media.scrubFps;
      flushSeek();
    };

    const scheduleScrub = (progress: number) => {
      latestProgress = progress;
      const now = performance.now();
      const remaining = scrubIntervalMs - (now - lastScrubAt);
      if (remaining <= 0) {
        window.clearTimeout(scrubTimer);
        scrubTimer = 0;
        lastScrubAt = now;
        scrubVideo(latestProgress);
        return;
      }

      if (scrubTimer) return;
      scrubTimer = window.setTimeout(() => {
        scrubTimer = 0;
        lastScrubAt = performance.now();
        scrubVideo(latestProgress);
      }, remaining);
    };

    const syncProgress = (progress: number) => {
      latestProgress = progress;

      const opacity = String(cinematicOpacity(progress));
      if (video.style.opacity !== opacity) video.style.opacity = opacity;

      const placeholderOpacity = status === "missing" ? opacity : "0";
      if (placeholder.style.opacity !== placeholderOpacity) {
        placeholder.style.opacity = placeholderOpacity;
      }

      scheduleScrub(progress);
    };

    const onLoadedData = () => {
      setStatus("ready");
      scheduleScrub(latestProgress);
    };
    const onSeeked = () => flushSeek();
    const onError = () => {
      setStatus("missing");
      if (!preloadThresholdReached) {
        preloadThresholdReached = true;
        onPreloadThreshold?.();
      }
    };
    const onProgress = () => checkPreloadThreshold();

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.addEventListener("progress", onProgress);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setStatus("ready");
    }
    checkPreloadThreshold();

    const unsubscribe = progressSignal.subscribe(syncProgress);
    syncProgress(latestProgress);

    return () => {
      unsubscribe();
      window.clearTimeout(scrubTimer);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.removeEventListener("progress", onProgress);
    };
  }, [progressSignal, status, onPreloadThreshold]);

  return (
    <div className="cinematic-layer" data-layer="cinematic" aria-hidden="true">
      <div className="cinematic-slot">
        <video
          ref={videoRef}
          className="cinematic-video"
          src={assetByKey.cinematic.src}
          data-loaded={status === "ready" ? "true" : undefined}
          muted
          playsInline
          preload="auto"
        />
        <div ref={placeholderRef} className="cinematic-placeholder">
          <span>Missing development asset</span>
          <strong>{assetByKey.cinematic.label}</strong>
        </div>
      </div>
    </div>
  );
}
