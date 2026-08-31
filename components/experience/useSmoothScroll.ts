"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experienceTuning } from "@/lib/experience/config";
import type { ExperienceProfile } from "@/lib/experience/profile";

export function useSmoothScroll(
  locked: boolean,
  profile?: ExperienceProfile,
) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || profile?.inputMode === "coarse") return;

    const lenis = new Lenis({
      autoRaf: false,
      duration: experienceTuning.smoothScroll.duration,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: experienceTuning.smoothScroll.wheelMultiplier,
    });
    lenisRef.current = lenis;

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    const updateScrollTrigger = () => ScrollTrigger.update();
    const resizeLenis = () => lenis.resize();

    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(update);
    const unsubscribe = lenis.on("scroll", updateScrollTrigger);
    ScrollTrigger.addEventListener("refresh", resizeLenis);
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      unsubscribe();
      ScrollTrigger.removeEventListener("refresh", resizeLenis);
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [profile?.inputMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("experience-is-locked", locked);
    return () => {
      document.documentElement.classList.remove("experience-is-locked");
    };
  }, [locked]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (locked) {
      lenis.stop();
    } else {
      lenis.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [locked]);

  return lenisRef;
}
