"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { GlassCard, CTAButton } from "./GlassCard";
import { AmbientVideo, CinematicVideoLayer } from "./MediaLayers";
import { PackSceneCanvas, type PackSceneReady } from "./PackSceneCanvas";
import { useAssistedScroll } from "./useAssistedScroll";
import { useSmoothScroll } from "./useSmoothScroll";
import {
  currentChapter,
  experienceTuning,
  layerTransitions,
  uiMotion,
  uiWindows,
} from "@/lib/experience/config";
import {
  createExperienceProgressSignal,
  type ExperienceProgressSignal,
} from "@/lib/experience/progress";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type VideoStatus = Record<string, "loading" | "ready" | "missing">;

const defaultVideoStatus: VideoStatus = {
  scene1: "loading",
  scene2: "loading",
  scene3: "loading",
  scene4: "loading",
};

function Loader({ exiting, progress }: { exiting: boolean; progress: number }) {
  return (
    <div
      className={`experience-loader ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-label={`Preparing the experience: ${progress}%`}
    >
      <div className="experience-loader__mark">MS</div>
      <p>Preparing the experience</p>
      <div className="experience-loader__track" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <span className="experience-loader__value">{progress}%</span>
    </div>
  );
}

function StoryCardShell({
  name,
  className,
  children,
}: {
  name: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`story-card ${className}`} data-card={name}>
      <div className="story-card__motion" data-card-motion>
        {children}
      </div>
    </section>
  );
}

const storyCardWindows = {
  hero: uiWindows.hero,
  "two-paths": uiWindows.twoPaths,
  "first-drop": uiWindows.firstDrop,
  classes: uiWindows.classes,
  rarities: uiWindows.rarities,
  artists: uiWindows.artists,
  final: uiWindows.final,
} as const;

function StoryCards({
  progressSignal,
}: {
  progressSignal: ExperienceProgressSignal;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const cards = Array.from(
      overlay.querySelectorAll<HTMLElement>("[data-card]"),
    );

    const syncActiveCards = (progress: number) => {
      cards.forEach((card) => {
        const name = card.dataset.card as keyof typeof storyCardWindows;
        const activeRange = storyCardWindows[name];
        if (!activeRange) return;
        const active =
          progress >= activeRange[0] - layerTransitions.uiTransition &&
          progress <= activeRange[1] + layerTransitions.uiTransition;
        const nextValue = active ? "true" : "false";
        if (card.dataset.cardActive !== nextValue) {
          card.dataset.cardActive = nextValue;
        }
      });
    };

    syncActiveCards(progressSignal.get());
    return progressSignal.subscribe(syncActiveCards);
  }, [progressSignal]);

  return (
    <div className="story-overlay" data-layer="ui" ref={overlayRef}>
      <StoryCardShell name="hero" className="story-card--hero">
        <GlassCard className="glass-card--hero">
          <h1>
            <span>MUTABLE</span>
            <span>SOLDIERS</span>
          </h1>
          <p className="hero-collection">COLLECTION</p>
          <div className="cta-row">
            <CTAButton>Join the Waitlist</CTAButton>
            <CTAButton variant="secondary">View Collection</CTAButton>
          </div>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell name="two-paths" className="story-card--center">
        <GlassCard>
          <h2>
            <span>Two Packs.</span>
            <span>Two Paths.</span>
          </h2>
          <p>
            Cada pack contiene sus propias clases únicas en colaboracion con distintos
            artistas de NFTs.
          </p>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell
        name="first-drop"
        className="story-card--center story-card--first-drop"
      >
        <GlassCard className="glass-card--wide">
          <h2>
            <span>First Drop Reveal:</span>
            <span>Soldiers of the</span>
            <span>Ancient World</span>
          </h2>
          <p>The countdown has begun, the first drop is on its way.</p>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell name="classes" className="story-card--left">
        <GlassCard>
          <p className="story-number">09</p>
          <h2>Classes</h2>
          <p>
            Each class represents a type of historical warrior with the essence of the
            XRP Army.
          </p>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell name="rarities" className="story-card--right">
        <GlassCard>
          <p className="story-number">03</p>
          <h2>Rarities</h2>
          <p className="rarity-copy">
            <span>COMMON: Represent anonymous historical warriors.</span>
            <span>
              RARE: Feature fictional or historical characters from popular culture.
            </span>
            <span>SPECIAL: Exclusive 1/1 NFTs created by featured NFT artists.</span>
          </p>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell name="artists" className="story-card--artists">
        <GlassCard className="glass-card--artists">
          <p className="story-number">16</p>
          <h2>Featured Artists</h2>
          <p>
            The XRPL is home to incredible talent, and that is why the ARMY wants to
            shine a spotlight on them. From renowned, established artists who are
            pillars of the network, to highly talented emerging creators. Together, we
            will make the XRPL the leading network for artists.
          </p>
        </GlassCard>
      </StoryCardShell>

      <StoryCardShell name="final" className="story-card--final">
        <GlassCard className="glass-card--final">
          <h2>
            <span>Join the Ranks.</span>
            <span>Secure your Spot.</span>
          </h2>
          <div className="cta-row cta-row--center">
            <CTAButton>Join the WaitList</CTAButton>
          </div>
        </GlassCard>
      </StoryCardShell>
    </div>
  );
}

export function MutableSoldiersExperience() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressSignalRef = useRef<ExperienceProgressSignal | null>(null);
  if (!progressSignalRef.current) {
    progressSignalRef.current = createExperienceProgressSignal();
  }
  const progressSignal = progressSignalRef.current;
  const [ambientReady, setAmbientReady] = useState<boolean | null>(null);
  const [packStatus, setPackStatus] = useState<PackSceneReady | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>(defaultVideoStatus);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [debug, setDebug] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);

  const lenisRef = useSmoothScroll(loaderVisible);
  useAssistedScroll({ disabled: loaderVisible, lenisRef });

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!document.fonts) {
      setFontsReady(true);
      return;
    }
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onAmbientSettled = useCallback((available: boolean) => {
    setAmbientReady(available);
  }, []);
  const onPacksReady = useCallback((result: PackSceneReady) => {
    setPackStatus(result);
  }, []);
  const onVideoStatus = useCallback((status: VideoStatus) => {
    setVideoStatus(status);
  }, []);

  useEffect(() => {
    let remove = 0;
    const forceRelease = window.setTimeout(() => {
      setLoaderExiting(true);
      remove = window.setTimeout(() => setLoaderVisible(false), 700);
    }, experienceTuning.loaderTimeoutMs);

    return () => {
      window.clearTimeout(forceRelease);
      window.clearTimeout(remove);
    };
  }, []);

  useEffect(() => {
    if (fontsReady && ambientReady !== null && packStatus !== null) {
      const exit = window.setTimeout(() => setLoaderExiting(true), 250);
      const remove = window.setTimeout(() => setLoaderVisible(false), 950);
      return () => {
        window.clearTimeout(exit);
        window.clearTimeout(remove);
      };
    }
  }, [ambientReady, fontsReady, packStatus]);

  const hasMissingAssets =
    ambientReady === false ||
    Boolean(packStatus?.usingFallbacks) ||
    Object.values(videoStatus).some((value) => value === "missing");
  const showDiagnostics = debug || hasMissingAssets;

  useEffect(() => {
    if (!showDiagnostics) return;
    const interval = window.setInterval(
      () => setDiagnosticProgress(progressSignal.get()),
      160,
    );
    return () => window.clearInterval(interval);
  }, [progressSignal, showDiagnostics]);

  useGSAP(
    () => {
      const scrollRoot = scrollRef.current;
      if (!scrollRoot) return;

      const cards = gsap.utils.toArray<HTMLElement>("[data-card-motion]");
      gsap.set(cards, {
        autoAlpha: 0,
        y: uiMotion.enterY,
        z: uiMotion.enterZ,
        scale: uiMotion.enterScale,
        rotationX: uiMotion.enterRotationX,
        rotationY: uiMotion.enterRotationY,
        transformOrigin: "50% 50%",
      });
      gsap.set('[data-card="hero"] [data-card-motion]', {
        autoAlpha: 1,
        y: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
      });
      gsap.set('[data-layer="ambient"]', { opacity: 1 });
      gsap.set('[data-layer="webgl"]', { opacity: 1 });

      const media = gsap.matchMedia();
      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          fullMotion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const reduceMotion = Boolean(context.conditions?.reduceMotion);
          const transitionDuration = reduceMotion
            ? 0.001
            : layerTransitions.uiTransition;
          const driver = { progress: 0 };
          const timeline = gsap.timeline({ defaults: { ease: "none" } });
          timeline.to(driver, { progress: 1, duration: 1 }, 0);

          const reveal = (selector: string, start: number, end: number) => {
            timeline.fromTo(
              selector,
              {
                autoAlpha: 0,
                y: reduceMotion ? 0 : uiMotion.enterY,
                z: reduceMotion ? 0 : uiMotion.enterZ,
                scale: reduceMotion ? 1 : uiMotion.enterScale,
                rotationX: reduceMotion ? 0 : uiMotion.enterRotationX,
                rotationY: reduceMotion ? 0 : uiMotion.enterRotationY,
              },
              {
                autoAlpha: 1,
                y: 0,
                z: 0,
                scale: 1,
                rotationX: 0,
                rotationY: 0,
                duration: transitionDuration,
                immediateRender: false,
              },
              start,
            );
            if (end < 1) {
              timeline.to(
                selector,
                {
                  autoAlpha: 0,
                  y: reduceMotion ? 0 : uiMotion.exitY,
                  z: reduceMotion ? 0 : uiMotion.exitZ,
                  scale: reduceMotion ? 1 : uiMotion.exitScale,
                  rotationX: reduceMotion ? 0 : uiMotion.exitRotationX,
                  rotationY: reduceMotion ? 0 : uiMotion.exitRotationY,
                  duration: transitionDuration,
                },
                end - transitionDuration,
              );
            }
          };

          timeline.to(
            '[data-card="hero"] [data-card-motion]',
            {
              autoAlpha: 0,
              y: reduceMotion ? 0 : uiMotion.heroExitY,
              z: reduceMotion ? 0 : uiMotion.heroExitZ,
              scale: reduceMotion ? 1 : uiMotion.heroExitScale,
              rotationX: reduceMotion ? 0 : uiMotion.heroExitRotationX,
              rotationY: reduceMotion ? 0 : uiMotion.heroExitRotationY,
              duration: transitionDuration * 1.5,
            },
            uiWindows.hero[1] - transitionDuration * 1.5,
          );
          reveal(
            '[data-card="two-paths"] [data-card-motion]',
            ...uiWindows.twoPaths,
          );
          reveal(
            '[data-card="first-drop"] [data-card-motion]',
            ...uiWindows.firstDrop,
          );
          reveal(
            '[data-card="classes"] [data-card-motion]',
            ...uiWindows.classes,
          );
          reveal(
            '[data-card="rarities"] [data-card-motion]',
            ...uiWindows.rarities,
          );
          reveal(
            '[data-card="artists"] [data-card-motion]',
            ...uiWindows.artists,
          );
          reveal(
            '[data-card="final"] [data-card-motion]',
            ...uiWindows.final,
          );

          timeline.to(
            '[data-layer="ambient"]',
            {
              opacity: 0,
              duration:
                layerTransitions.webglToCinematic[1] -
                layerTransitions.webglToCinematic[0],
            },
            layerTransitions.webglToCinematic[0],
          );
          timeline.to(
            '[data-layer="webgl"]',
            {
              opacity: 0,
              duration:
                layerTransitions.webglToCinematic[1] -
                layerTransitions.webglToCinematic[0],
            },
            layerTransitions.webglToCinematic[0],
          );
          timeline.to(
            '[data-layer="ambient"]',
            {
              opacity: 1,
              duration:
                layerTransitions.cinematicToAmbient[1] -
                layerTransitions.cinematicToAmbient[0],
            },
            layerTransitions.cinematicToAmbient[0],
          );
          timeline.to(
            '[data-layer="webgl"]',
            {
              opacity: 1,
              duration:
                layerTransitions.cinematicToAmbient[1] -
                layerTransitions.cinematicToAmbient[0],
            },
            layerTransitions.cinematicToAmbient[0],
          );

          const trigger = ScrollTrigger.create({
            id: "mutable-soldiers-master",
            trigger: scrollRoot,
            start: "top top",
            end: "bottom bottom",
            animation: timeline,
            scrub: reduceMotion ? true : uiMotion.scrollScrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progressSignal.set(self.progress);
            },
          });

          progressSignal.set(trigger.progress);

          requestAnimationFrame(() => ScrollTrigger.refresh());
          return () => {
            trigger.kill();
            timeline.kill();
          };
        },
      );

      return () => media.revert();
    },
    { scope: scrollRef },
  );

  const style = {
    "--experience-scroll-vh": `${experienceTuning.scrollLengthVh}vh`,
  } as CSSProperties;
  const chapter = currentChapter(diagnosticProgress);
  const criticalReadyCount =
    Number(fontsReady) + Number(ambientReady !== null) + Number(packStatus !== null);
  const loaderProgress = Math.round((criticalReadyCount / 3) * 100);

  return (
    <main className="experience-scroll" ref={scrollRef} style={style}>
      <div className="experience-stage" ref={stageRef}>
        <AmbientVideo
          progressSignal={progressSignal}
          onSettled={onAmbientSettled}
        />
        <div className="pack-layer" data-layer="webgl">
          <PackSceneCanvas
            progressSignal={progressSignal}
            debug={debug}
            onReady={onPacksReady}
          />
        </div>
        <CinematicVideoLayer
          progressSignal={progressSignal}
          onStatusChange={onVideoStatus}
        />
        <StoryCards progressSignal={progressSignal} />

        {showDiagnostics && (
          <aside className="experience-diagnostics" aria-live="polite">
            <strong>Development diagnostics</strong>
            <span>
              {(diagnosticProgress * 100).toFixed(1)}% · {chapter.label}
            </span>
            <span>Ambient: {ambientReady === null ? "loading" : ambientReady ? "ready" : "missing"}</span>
            <span>
              Packs: {packStatus === null ? "loading" : packStatus.usingFallbacks ? "fallback" : "ready"}
            </span>
            <span>
              Videos: {Object.values(videoStatus).filter((value) => value === "ready").length}/4 ready
            </span>
          </aside>
        )}

        {loaderVisible && (
          <Loader exiting={loaderExiting} progress={loaderProgress} />
        )}
      </div>
    </main>
  );
}
