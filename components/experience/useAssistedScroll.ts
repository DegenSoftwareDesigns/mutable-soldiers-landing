"use client";

import { useEffect, type MutableRefObject } from "react";
import type Lenis from "lenis";
import {
  assistedScrollAnchors,
  experienceTuning,
} from "@/lib/experience/config";

type AssistedScrollOptions = {
  disabled: boolean;
  lenisRef: MutableRefObject<Lenis | null>;
};

const cubicInOut = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }
  return event.deltaY;
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, summary, [contenteditable='true']",
      ),
    )
  );
}

export function useAssistedScroll({
  disabled,
  lenisRef,
}: AssistedScrollOptions) {
  useEffect(() => {
    if (disabled) return;

    const tuning = experienceTuning.assistedScroll;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const smoothScroller = lenisRef.current;
    let locked = false;
    let wheelIntent = 0;
    let touchStartY: number | null = null;
    let touchStartedOnInteractiveElement = false;
    let intentResetTimer = 0;
    let dwellTimer = 0;
    let transitionFallbackTimer = 0;

    const clearTimers = () => {
      window.clearTimeout(intentResetTimer);
      window.clearTimeout(dwellTimer);
      window.clearTimeout(transitionFallbackTimer);
    };

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const currentProgress = () => {
      const maximum = maxScroll();
      return maximum > 0 ? window.scrollY / maximum : 0;
    };

    const targetIndexForDirection = (direction: 1 | -1) => {
      const progress = currentProgress();
      const epsilon = tuning.anchorEpsilon;
      if (direction > 0) {
        return assistedScrollAnchors.findIndex(
          (anchor) => anchor.progress > progress + epsilon,
        );
      }

      for (let index = assistedScrollAnchors.length - 1; index >= 0; index -= 1) {
        if (assistedScrollAnchors[index].progress < progress - epsilon) {
          return index;
        }
      }
      return -1;
    };

    const release = () => {
      locked = false;
      wheelIntent = 0;
      smoothScroller?.start();
      document.documentElement.removeAttribute("data-scroll-assist-locked");
    };

    const beginDwell = () => {
      window.clearTimeout(transitionFallbackTimer);
      smoothScroller?.stop();
      dwellTimer = window.setTimeout(release, tuning.dwellMs);
    };

    const moveToAnchor = (direction: 1 | -1) => {
      if (locked) return;
      const targetIndex = targetIndexForDirection(direction);
      if (targetIndex < 0) return;

      const anchor = assistedScrollAnchors[targetIndex];
      const distance = Math.abs(anchor.progress - currentProgress());
      const duration = Math.min(
        tuning.maxTransitionSeconds,
        Math.max(
          tuning.minTransitionSeconds,
          distance * tuning.secondsPerProgress,
        ),
      );
      const targetY = anchor.progress * maxScroll();
      const lenis = smoothScroller;
      let arrivalHandled = false;
      const handleArrival = () => {
        if (arrivalHandled) return;
        arrivalHandled = true;
        beginDwell();
      };

      locked = true;
      wheelIntent = 0;
      document.documentElement.setAttribute("data-scroll-assist-locked", "true");

      if (reduceMotion || !lenis) {
        window.scrollTo({ top: targetY, behavior: "auto" });
        handleArrival();
        return;
      }

      lenis.stop();
      lenis.scrollTo(targetY, {
        duration,
        easing: cubicInOut,
        force: true,
        lock: true,
        onComplete: handleArrival,
      });
      transitionFallbackTimer = window.setTimeout(
        handleArrival,
        duration * 1000 + 300,
      );
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < 0.01) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (locked) return;

      wheelIntent += normalizeWheelDelta(event);
      window.clearTimeout(intentResetTimer);
      intentResetTimer = window.setTimeout(() => {
        wheelIntent = 0;
      }, tuning.intentResetMs);

      if (Math.abs(wheelIntent) < tuning.wheelIntentThreshold) return;
      moveToAnchor(wheelIntent > 0 ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return;
      let direction: 1 | -1 | null = null;
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        (event.key === " " && !event.shiftKey)
      ) {
        direction = 1;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        (event.key === " " && event.shiftKey)
      ) {
        direction = -1;
      }
      if (!direction) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!locked) moveToAnchor(direction);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchStartedOnInteractiveElement = isInteractiveTarget(event.target);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY === null || touchStartedOnInteractiveElement) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (
        touchStartY === null ||
        touchStartedOnInteractiveElement ||
        event.changedTouches.length === 0
      ) {
        touchStartY = null;
        touchStartedOnInteractiveElement = false;
        return;
      }
      const delta = touchStartY - event.changedTouches[0].clientY;
      touchStartY = null;
      touchStartedOnInteractiveElement = false;
      if (locked || Math.abs(delta) < tuning.touchIntentThreshold) return;
      moveToAnchor(delta > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchend", onTouchEnd, { capture: true });

    return () => {
      clearTimers();
      smoothScroller?.start();
      document.documentElement.removeAttribute("data-scroll-assist-locked");
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
    };
  }, [disabled, lenisRef]);
}
