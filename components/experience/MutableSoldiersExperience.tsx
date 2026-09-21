"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  TiltCard,
  TiltCardItem,
} from "@/components/spectrumui/tilt-card";
import { CTAButton, GlassCard, LayeredGlassCard } from "./GlassCard";
import {
  AmbientVideo,
  CinematicVideoLayer,
  type CinematicVideoStatus,
} from "./MediaLayers";
import { PackSceneCanvas, type PackSceneReady } from "./PackSceneCanvas";
import { SiteFooter } from "./SiteFooter";
import { SiteNavbar } from "./SiteNavbar";
import { useSmoothScroll } from "./useSmoothScroll";
import { ResponsiveSkeletonLayers } from "./ResponsiveSkeletonLayers";
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
import {
  detectExperienceProfile,
  profileLabel,
  profileSelectionChanged,
  type ExperienceDevice,
  type ExperienceProfile,
} from "@/lib/experience/profile";
import { selectExperienceAssets } from "@/lib/experience/assets";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

function Loader({
  exiting,
  progress,
  profile,
}: {
  exiting: boolean;
  progress: number;
  profile?: ExperienceProfile;
}) {
  return (
    <div
      className={`experience-loader ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-label={`Preparing the experience: ${progress}%`}
    >
      <div className="experience-loader__mark">MS</div>
      <p>
        {profile
          ? `Optimizing ${profile.device} experience`
          : "Preparing the optimal experience"}
      </p>
      <div className="experience-loader__track" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <span className="experience-loader__value">{progress}%</span>
    </div>
  );
}

function AspectRatioNotice({
  profile,
  onContinue,
  onReload,
}: {
  profile: ExperienceProfile;
  onContinue: () => void;
  onReload: () => void;
}) {
  return (
    <aside className="aspect-ratio-notice" aria-live="polite">
      <div>
        <strong>New aspect ratio detected</strong>
        <span>
          Load the optimized {profile.orientation} experience for this screen?
        </span>
      </div>
      <div className="aspect-ratio-notice__actions">
        <button type="button" onClick={onReload}>
          Load optimized version
        </button>
        <button type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </aside>
  );
}

type ExperiencePreviewOptions = {
  enabled: boolean;
  skeleton: boolean;
  overlay: boolean;
  chapter: keyof typeof storyCardWindows | null;
  deviceOverride?: ExperienceDevice;
};

const emptyPreviewOptions: ExperiencePreviewOptions = {
  enabled: false,
  skeleton: false,
  overlay: false,
  chapter: null,
};

function readPreviewOptions(): ExperiencePreviewOptions {
  if (process.env.NODE_ENV === "production") return emptyPreviewOptions;
  const params = new URLSearchParams(window.location.search);
  if (params.get("experiencePreview") !== "1") return emptyPreviewOptions;
  const deviceParam = params.get("device");
  const chapterParam = params.get("chapter");
  const deviceOverride =
    deviceParam === "desktop" ||
    deviceParam === "tablet" ||
    deviceParam === "mobile"
      ? deviceParam
      : undefined;
  const chapter =
    chapterParam && chapterParam in storyCardWindows
      ? (chapterParam as keyof typeof storyCardWindows)
      : null;

  return {
    enabled: true,
    skeleton: params.get("skeleton") !== "0",
    overlay: params.get("overlay") !== "0",
    chapter,
    deviceOverride,
  };
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
  footer: uiWindows.footer,
} as const;

function StoryCards({
  progressSignal,
  profile,
}: {
  progressSignal: ExperienceProgressSignal;
  profile: ExperienceProfile;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardInteractive =
    profile.device === "desktop" && profile.inputMode === "fine";

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
        <TiltCard
          containerClassName="spectrum-hero-card-stage"
          className="glass-card glass-card--hero spectrum-hero-card"
          maxTilt={12}
          scale={1.02}
          perspective={1000}
          interactive={cardInteractive}
          unstyled
        >
          <div aria-hidden="true" className="spectrum-hero-card__surface" />
          <div className="glass-card__content spectrum-hero-card__content">
            <TiltCardItem depth={96}>
              <h1>
                <span>MUTABLE</span>
                <span>SOLDIERS</span>
              </h1>
            </TiltCardItem>
            <TiltCardItem depth={68}>
              <p className="hero-collection">COLLECTION</p>
            </TiltCardItem>
            <TiltCardItem depth={96}>
              <div className="cta-row">
                <CTAButton>Join the Waitlist</CTAButton>
                <CTAButton variant="secondary">View Collection</CTAButton>
              </div>
            </TiltCardItem>
          </div>
        </TiltCard>
      </StoryCardShell>

      <StoryCardShell name="two-paths" className="story-card--center">
        <LayeredGlassCard interactive={cardInteractive}>
          <h2 className="spectrum-layered-card__heading">
            <TiltCardItem as="span" depth={40}>
              Two packs,
            </TiltCardItem>
            <TiltCardItem as="span" depth={72}>
              Two paths
            </TiltCardItem>
          </h2>
          <TiltCardItem depth={96}>
            <p>
              Different classes. Countless combinations. A unique path shaped with
              every drop.
            </p>
          </TiltCardItem>
        </LayeredGlassCard>
      </StoryCardShell>

      <StoryCardShell
        name="first-drop"
        className="story-card--center story-card--first-drop"
      >
        <LayeredGlassCard
          className="glass-card--wide"
          interactive={cardInteractive}
        >
          <h2 className="spectrum-layered-card__heading">
            <TiltCardItem as="span" depth={40}>
              First Drop:
            </TiltCardItem>
            <TiltCardItem as="span" depth={72}>
              <span>Soldiers of the</span>
              <span>Ancient World</span>
            </TiltCardItem>
          </h2>
          <TiltCardItem depth={96}>
            <p>The countdown has begun, the first drop is on its way.</p>
          </TiltCardItem>
        </LayeredGlassCard>
      </StoryCardShell>

      <StoryCardShell name="classes" className="story-card--left">
        <LayeredGlassCard
          restRotateY={8}
          maxTilt={6}
          interactive={cardInteractive}
        >
          <TiltCardItem depth={56}>
            <h2 className="story-heading--single-line">9 Classes</h2>
          </TiltCardItem>
          <TiltCardItem depth={96}>
            <p>
              Each class represents a type of historical warrior with the essence of
              the XRP Army.
            </p>
          </TiltCardItem>
        </LayeredGlassCard>
      </StoryCardShell>

      <StoryCardShell name="rarities" className="story-card--right">
        <LayeredGlassCard
          restRotateY={-8}
          maxTilt={6}
          interactive={cardInteractive}
        >
          <TiltCardItem depth={56}>
            <h2 className="story-heading--single-line">3 Rarities</h2>
          </TiltCardItem>
          <TiltCardItem depth={96}>
            <p className="rarity-copy">
              <span>COMMON: Represent anonymous historical warriors.</span>
              <span>
                RARE: Feature fictional or historical characters from popular culture.
              </span>
              <span>SPECIAL: Exclusive 1/1 NFTs created by featured NFT artists.</span>
            </p>
          </TiltCardItem>
        </LayeredGlassCard>
      </StoryCardShell>

      <StoryCardShell name="artists" className="story-card--artists">
        <LayeredGlassCard
          className="glass-card--artists"
          restRotateX={10}
          maxTilt={4}
          perspective={650}
          interactive={cardInteractive}
        >
          <TiltCardItem depth={56}>
            <h2 className="story-heading--single-line">16 Artists</h2>
          </TiltCardItem>
          <TiltCardItem depth={96}>
            <p>
              1/1 Special NFTs crafted by some of the greatest artists
              <br />
              in this space. Each of them representing their own essence through an
              ARMY soldier.
            </p>
          </TiltCardItem>
        </LayeredGlassCard>
      </StoryCardShell>

    </div>
  );
}

function ClosingSequence({ profile }: { profile: ExperienceProfile }) {
  const cardInteractive =
    profile.device === "desktop" && profile.inputMode === "fine";

  return (
    <div className="closing-overlay" data-layer="closing">
      <div className="closing-track" data-closing-track>
        <section className="closing-section closing-section--cta" data-card="final">
          <TiltCard
            containerClassName="glass-card-stage spectrum-final-card-stage"
            className="glass-card glass-card--final spectrum-hero-card spectrum-final-card"
            maxTilt={12}
            scale={1.02}
            perspective={1000}
            interactive={cardInteractive}
            unstyled
          >
            <div
              aria-hidden="true"
              className="spectrum-hero-card__surface spectrum-final-card__surface"
            />
            <div className="glass-card__content spectrum-hero-card__content spectrum-final-card__content">
              <h2 className="spectrum-final-card__heading">
                <TiltCardItem as="span" depth={40}>
                  Join the Ranks.
                </TiltCardItem>
                <TiltCardItem as="span" depth={72}>
                  Secure your Spot.
                </TiltCardItem>
              </h2>
              <TiltCardItem depth={96}>
                <div className="cta-row cta-row--center">
                  <CTAButton>Join the WaitList</CTAButton>
                </div>
              </TiltCardItem>
            </div>
          </TiltCard>
        </section>

        <section className="closing-section closing-section--footer" data-card="footer">
          <SiteFooter placement="closing" />
        </section>
      </div>
    </div>
  );
}

function ExperienceRuntime({
  profile,
  preview,
}: {
  profile: ExperienceProfile;
  preview: ExperiencePreviewOptions;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewJumpedRef = useRef(false);
  const progressSignalRef = useRef<ExperienceProgressSignal | null>(null);
  if (!progressSignalRef.current) {
    progressSignalRef.current = createExperienceProgressSignal();
  }
  const progressSignal = progressSignalRef.current;
  const [ambientReady, setAmbientReady] = useState<boolean | null>(null);
  const [packStatus, setPackStatus] = useState<PackSceneReady | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [videoStatus, setVideoStatus] =
    useState<CinematicVideoStatus>("loading");
  const [cinematicPreloadReady, setCinematicPreloadReady] = useState(false);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [debug, setDebug] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [pendingProfile, setPendingProfile] =
    useState<ExperienceProfile | null>(null);
  const [layoutProfile, setLayoutProfile] = useState(profile);
  const assetSet = useMemo(() => selectExperienceAssets(profile), [profile]);

  useSmoothScroll(loaderVisible, profile);

  useEffect(() => {
    setDebug(
      new URLSearchParams(window.location.search).has("debug") ||
        preview.overlay,
    );
  }, [preview.overlay]);

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

  useEffect(() => {
    if (!preview.skeleton) return;
    setAmbientReady(true);
    setPackStatus({ usingFallbacks: false, errors: [] });
    setVideoStatus("ready");
    setCinematicPreloadReady(true);
  }, [preview.skeleton]);

  const onAmbientSettled = useCallback((available: boolean) => {
    setAmbientReady(available);
  }, []);
  const onPacksReady = useCallback((result: PackSceneReady) => {
    setPackStatus(result);
  }, []);
  const onVideoStatus = useCallback((status: CinematicVideoStatus) => {
    setVideoStatus(status);
  }, []);
  const onCinematicPreloadThreshold = useCallback(() => {
    setCinematicPreloadReady(true);
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
      if (!cinematicPreloadReady) return;
      const exit = window.setTimeout(() => setLoaderExiting(true), 250);
      const remove = window.setTimeout(() => setLoaderVisible(false), 950);
      return () => {
        window.clearTimeout(exit);
        window.clearTimeout(remove);
      };
    }
  }, [ambientReady, cinematicPreloadReady, fontsReady, packStatus]);

  useEffect(() => {
    let resizeTimer = 0;
    const detectChange = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const next = detectExperienceProfile(preview.deviceOverride);
        if (!profileSelectionChanged(profile, next)) {
          setLayoutProfile(profile);
          setPendingProfile(null);
          return;
        }
        setLayoutProfile(next);
        const dismissedKey = `mutable-soldiers:aspect-dismissed:${next.key}`;
        if (window.sessionStorage.getItem(dismissedKey) === "1") return;
        setPendingProfile(next);
      }, 450);
    };

    window.addEventListener("resize", detectChange);
    window.addEventListener("orientationchange", detectChange);
    window.visualViewport?.addEventListener("resize", detectChange);
    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", detectChange);
      window.removeEventListener("orientationchange", detectChange);
      window.visualViewport?.removeEventListener("resize", detectChange);
    };
  }, [preview.deviceOverride, profile]);

  useEffect(() => {
    if (!preview.enabled || !preview.chapter || loaderVisible) return;
    if (previewJumpedRef.current) return;
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;

    const range = storyCardWindows[preview.chapter];
    const targetProgress = (range[0] + range[1]) / 2;
    previewJumpedRef.current = true;
    requestAnimationFrame(() => {
      const rootTop = scrollRoot.getBoundingClientRect().top + window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const narrativeEnd = Math.max(
        rootTop,
        rootTop +
          (scrollRoot.querySelector<HTMLElement>('[data-layer="closing"]')
            ?.offsetTop ?? maxScroll - rootTop),
      );
      const targetScroll =
        preview.chapter === "final"
          ? narrativeEnd
          : preview.chapter === "footer"
            ? maxScroll
            : rootTop + (narrativeEnd - rootTop) * targetProgress;
      window.scrollTo({
        top: Math.min(targetScroll, maxScroll),
        behavior: "auto",
      });
    });
  }, [loaderVisible, preview.chapter, preview.enabled]);

  const hasMissingAssets =
    ambientReady === false ||
    Boolean(packStatus?.usingFallbacks) ||
    videoStatus === "missing";
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
        rotationZ: 0,
        skewX: 0,
        skewY: 0,
        visibility: "hidden",
        y: uiMotion.enterY,
        z: uiMotion.enterZ,
        scale: uiMotion.enterScale,
        rotationX: uiMotion.enterRotationX,
        rotationY: uiMotion.enterRotationY,
        transformOrigin: "50% 50%",
      });
      gsap.set('[data-card="hero"] [data-card-motion]', {
        visibility: "inherit",
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

          const reveal = (
            selector: string,
            start: number,
            end: number,
            yawDirection: -1 | 1,
          ) => {
            timeline.fromTo(
              selector,
              {
                "--story-reveal": "0",
                y: reduceMotion ? 0 : uiMotion.enterY,
                z: reduceMotion ? 0 : uiMotion.enterZ,
                scale: reduceMotion ? 1 : uiMotion.enterScale,
                rotationX: reduceMotion ? 0 : uiMotion.enterRotationX,
                rotationY: reduceMotion
                  ? 0
                  : uiMotion.enterRotationY * yawDirection,
              },
              {
                "--story-reveal": "1",
                visibility: "inherit",
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
                  "--story-reveal": "0",
                  y: reduceMotion ? 0 : uiMotion.exitY,
                  z: reduceMotion ? 0 : uiMotion.exitZ,
                  scale: reduceMotion ? 1 : uiMotion.exitScale,
                  rotationX: reduceMotion ? 0 : uiMotion.exitRotationX,
                  rotationY: reduceMotion ? 0 : uiMotion.exitRotationY,
                  duration: transitionDuration,
                },
                end - transitionDuration,
              );
              timeline.set(selector, { visibility: "hidden" }, end);
            }
          };

          timeline.to(
            '[data-card="hero"] [data-card-motion]',
            {
              "--story-reveal": "0",
              y: reduceMotion ? 0 : uiMotion.heroExitY,
              z: reduceMotion ? 0 : uiMotion.heroExitZ,
              scale: reduceMotion ? 1 : uiMotion.heroExitScale,
              rotationX: reduceMotion ? 0 : uiMotion.heroExitRotationX,
              rotationY: reduceMotion ? 0 : uiMotion.heroExitRotationY,
              duration: transitionDuration * 1.5,
            },
            uiWindows.hero[1] - transitionDuration * 1.5,
          );
          timeline.set(
            '[data-card="hero"] [data-card-motion]',
            { visibility: "hidden" },
            uiWindows.hero[1],
          );
          reveal(
            '[data-card="two-paths"] [data-card-motion]',
            ...uiWindows.twoPaths,
            -1,
          );
          reveal(
            '[data-card="first-drop"] [data-card-motion]',
            ...uiWindows.firstDrop,
            1,
          );
          reveal(
            '[data-card="classes"] [data-card-motion]',
            ...uiWindows.classes,
            1,
          );
          reveal(
            '[data-card="rarities"] [data-card-motion]',
            ...uiWindows.rarities,
            -1,
          );
          reveal(
            '[data-card="artists"] [data-card-motion]',
            ...uiWindows.artists,
            1,
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

          timeline.eventCallback("onUpdate", () => {
            progressSignal.set(timeline.progress());
          });

          const storyEndPosition = () =>
            Math.max(
              0,
              scrollRoot.offsetTop +
                (scrollRoot.querySelector<HTMLElement>('[data-layer="closing"]')
                  ?.offsetTop ?? scrollRoot.scrollHeight),
            );

          const trigger = ScrollTrigger.create({
            id: "mutable-soldiers-master",
            trigger: scrollRoot,
            start: "top top",
            end: storyEndPosition,
            animation: timeline,
            scrub: true,
            invalidateOnRefresh: true,
          });

          progressSignal.set(timeline.progress());

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

  const storyScrollLengthVh =
    profile.device === "mobile"
      ? 1100
      : profile.device === "tablet"
        ? 1250
        : experienceTuning.scrollLengthVh;
  const style = {
    "--experience-scroll-vh": `${storyScrollLengthVh}vh`,
    "--experience-story-vh": `${storyScrollLengthVh}vh`,
  } as CSSProperties;
  const chapter = currentChapter(diagnosticProgress);
  const criticalReadyCount =
    1 +
    Number(fontsReady) +
    Number(ambientReady !== null) +
    Number(packStatus !== null) +
    Number(cinematicPreloadReady);
  const loaderProgress = Math.round((criticalReadyCount / 5) * 100);

  return (
    <main
      id="hero"
      className={`experience-scroll ${preview.skeleton ? "is-skeleton-preview" : ""}`}
      data-device={layoutProfile.device}
      data-orientation={layoutProfile.orientation}
      data-aspect={layoutProfile.aspectBucket}
      data-input={layoutProfile.inputMode}
      ref={scrollRef}
      style={style}
    >
      <div className="experience-stage" ref={stageRef}>
        <SiteNavbar device={layoutProfile.device} />
        {preview.skeleton ? (
          <ResponsiveSkeletonLayers
            assetSet={assetSet}
            profile={profile}
            progressSignal={progressSignal}
          />
        ) : (
          <>
            <AmbientVideo
              assetSet={assetSet}
              progressSignal={progressSignal}
              onSettled={onAmbientSettled}
            />
            <div className="pack-layer" data-layer="webgl">
              <PackSceneCanvas
                assetSet={assetSet}
                profile={profile}
                progressSignal={progressSignal}
                debug={debug}
                onReady={onPacksReady}
              />
            </div>
            <CinematicVideoLayer
              assetSet={assetSet}
              progressSignal={progressSignal}
              onStatusChange={onVideoStatus}
              onPreloadThreshold={onCinematicPreloadThreshold}
            />
          </>
        )}
        <StoryCards progressSignal={progressSignal} profile={profile} />

        {showDiagnostics && (
          <aside className="experience-diagnostics" aria-live="polite">
            <strong>Development diagnostics</strong>
            <span>
              {profileLabel(profile)} · {profile.viewportWidth}×
              {profile.viewportHeight} · DPR {profile.devicePixelRatio.toFixed(2)}
            </span>
            <span>
              {profile.orientation} · {profile.aspectBucket} · {profile.quality}
            </span>
            {layoutProfile.key !== profile.key && (
              <span>
                Live layout: {layoutProfile.orientation} · {layoutProfile.aspectBucket}
              </span>
            )}
            <span>
              Assets: {assetSet.targetRatio}
              {assetSet.usesDesktopFallbacks ? " (desktop fallback)" : ""}
            </span>
            <span>
              {(diagnosticProgress * 100).toFixed(1)}% · {chapter.label}
            </span>
            <span>Ambient: {ambientReady === null ? "loading" : ambientReady ? "ready" : "missing"}</span>
            <span>
              Packs: {packStatus === null ? "loading" : packStatus.usingFallbacks ? "fallback" : "ready"}
            </span>
            <span>Cinematic: {videoStatus}</span>
          </aside>
        )}

        {loaderVisible && (
          <Loader
            exiting={loaderExiting}
            progress={loaderProgress}
            profile={profile}
          />
        )}

        {pendingProfile && !loaderVisible && (
          <AspectRatioNotice
            profile={pendingProfile}
            onReload={() => window.location.reload()}
            onContinue={() => {
              window.sessionStorage.setItem(
                `mutable-soldiers:aspect-dismissed:${pendingProfile.key}`,
                "1",
              );
              setPendingProfile(null);
            }}
          />
        )}
      </div>
      <ClosingSequence profile={profile} />
    </main>
  );
}

export function MutableSoldiersExperience() {
  const [profile, setProfile] = useState<ExperienceProfile | null>(null);
  const [preview, setPreview] =
    useState<ExperiencePreviewOptions>(emptyPreviewOptions);

  useEffect(() => {
    const nextPreview = readPreviewOptions();
    setPreview(nextPreview);
    const frame = requestAnimationFrame(() => {
      setProfile(detectExperienceProfile(nextPreview.deviceOverride));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!profile) {
    return (
      <main className="experience-bootstrap">
        <Loader exiting={false} progress={0} />
      </main>
    );
  }

  return <ExperienceRuntime profile={profile} preview={preview} />;
}
