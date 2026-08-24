"use client";

import { useEffect, useRef, useState } from "react";
import { assetByKey } from "@/lib/experience/assets";
import {
  clamp01,
  cinematicScenes,
  layerTransitions,
  rangeProgress,
  smoothstep,
  verifiedMedia,
} from "@/lib/experience/config";

type AmbientVideoProps = {
  onSettled: (available: boolean) => void;
};

export function AmbientVideo({ onSettled }: AmbientVideoProps) {
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

    const update = () => {
      if (disposed) return;
      const progress = progressRef.current;

      cinematicScenes.forEach((scene, index) => {
        const video = videoRefs.current[index];
        const placeholder = placeholderRefs.current[index];
        const opacity = opacityForWindow(progress, scene.visibleRange);

        if (video) {
          video.style.opacity = String(opacity);
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.duration > 0) {
            const targetTime =
              rangeProgress(progress, scene.scrubRange) * Math.max(0, video.duration - 0.001);
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
            src={assetByKey[scene.key].src}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
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
