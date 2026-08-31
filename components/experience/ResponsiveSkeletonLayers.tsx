"use client";

import { useEffect, useRef } from "react";
import type { ExperienceAssetSet } from "@/lib/experience/assets";
import type { ExperienceProfile } from "@/lib/experience/profile";
import type { ExperienceProgressSignal } from "@/lib/experience/progress";
import {
  layerTransitions,
  rangeProgress,
  smoothstep,
} from "@/lib/experience/config";

function cinematicOpacity(progress: number) {
  const fadeIn = smoothstep(
    rangeProgress(progress, layerTransitions.webglToCinematic),
  );
  const fadeOut = smoothstep(
    rangeProgress(progress, layerTransitions.cinematicToAmbient),
  );
  return fadeIn * (1 - fadeOut);
}

function SlotLabel({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="responsive-skeleton__label">
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function ResponsiveSkeletonLayers({
  assetSet,
  profile,
  progressSignal,
}: {
  assetSet: ExperienceAssetSet;
  profile: ExperienceProfile;
  progressSignal: ExperienceProgressSignal;
}) {
  const cinematicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = (progress: number) => {
      if (cinematicRef.current) {
        cinematicRef.current.style.opacity = String(cinematicOpacity(progress));
      }
    };
    const unsubscribe = progressSignal.subscribe(sync);
    sync(progressSignal.get());
    return unsubscribe;
  }, [progressSignal]);

  const detail = `${profile.viewportWidth}×${profile.viewportHeight} · ${assetSet.targetRatio} · ${profile.aspectBucket}`;

  return (
    <>
      <div
        className="ambient-layer responsive-skeleton responsive-skeleton--ambient"
        data-layer="ambient"
        aria-hidden="true"
      >
        <div className="responsive-skeleton__grid" />
        <div className="responsive-skeleton__safe-area" />
        <SlotLabel
          eyebrow="Ambient asset slot"
          title={`${profile.device} ${assetSet.targetRatio}`}
          detail={detail}
        />
      </div>

      <div
        className="pack-layer responsive-skeleton responsive-skeleton--webgl"
        data-layer="webgl"
        aria-hidden="true"
      >
        <div className="responsive-skeleton__pack responsive-skeleton__pack--a">
          PACK A
        </div>
        <div className="responsive-skeleton__pack responsive-skeleton__pack--b">
          PACK B
        </div>
        <SlotLabel
          eyebrow="Adaptive WebGL slot"
          title={`${profile.quality} quality`}
          detail={`DPR ${profile.device === "desktop" ? "≤1.5" : profile.device === "tablet" ? "≤1.25" : "≤1.0"}`}
        />
      </div>

      <div
        ref={cinematicRef}
        className="cinematic-layer responsive-skeleton responsive-skeleton--cinematic"
        data-layer="cinematic"
        aria-hidden="true"
      >
        <div className="responsive-skeleton__grid" />
        <div className="responsive-skeleton__safe-area" />
        <SlotLabel
          eyebrow="Cinematic asset slot"
          title={`Future ${assetSet.targetRatio} sequence`}
          detail="Keep subjects outside the card exclusion zones"
        />
      </div>
    </>
  );
}
