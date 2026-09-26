import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const packScenePath = new URL(
  "../components/experience/PackSceneCanvas.tsx",
  import.meta.url,
);
const experiencePath = new URL(
  "../components/experience/MutableSoldiersExperience.tsx",
  import.meta.url,
);
const configPath = new URL("../lib/experience/config.ts", import.meta.url);
const assetsPath = new URL("../lib/experience/assets.ts", import.meta.url);
const mediaLayersPath = new URL(
  "../components/experience/MediaLayers.tsx",
  import.meta.url,
);
const navbarPath = new URL(
  "../components/experience/SiteNavbar.tsx",
  import.meta.url,
);
const footerPath = new URL(
  "../components/experience/SiteFooter.tsx",
  import.meta.url,
);
const waitlistPagePath = new URL("../app/waitlist/page.tsx", import.meta.url);
const waitlistLookupPath = new URL(
  "../components/waitlist/WaitlistLookup.tsx",
  import.meta.url,
);
const tiltCardPath = new URL(
  "../components/spectrumui/tilt-card.tsx",
  import.meta.url,
);
const glassCardPath = new URL(
  "../components/experience/GlassCard.tsx",
  import.meta.url,
);
const globalStylesPath = new URL("../app/globals.css", import.meta.url);
const glassCardStylesPath = new URL(
  "../assets/glass-tilt-card/GlassTiltCard.module.css",
  import.meta.url,
);

// These are source contracts, not a substitute for browser paint checks.
test("glass implementations consume the same backdrop and tint tokens", async () => {
  const [stylesSource, glassCardStylesSource] = await Promise.all([
    readFile(globalStylesPath, "utf8"),
    readFile(glassCardStylesPath, "utf8"),
  ]);
  for (const source of [stylesSource, glassCardStylesSource]) {
    assert.match(source, /backdrop-filter:\s*var\(--glass-backdrop\)/);
    assert.match(source, /background:\s*var\(--glass-tint\)/);
    assert.doesNotMatch(source, /blur\(clamp\(52px/);
  }
});

test("navbar and footer render the same glass surface as headline cards", async () => {
  const [glassCardSource, navbarSource, footerSource] = await Promise.all([
    readFile(glassCardPath, "utf8"),
    readFile(navbarPath, "utf8"),
    readFile(footerPath, "utf8"),
  ]);

  assert.match(
    glassCardSource,
    /export function StaticGlassCard[\s\S]*?spectrum-hero-card__surface/,
  );

  for (const source of [navbarSource, footerSource]) {
    assert.match(source, /<StaticGlassCard/);
    assert.doesNotMatch(source, /<GlassTiltCard/);
  }
});

test("story glass is not isolated by opacity or an extended outer 3D context", async () => {
  const [styles, experience] = await Promise.all([
    readFile(globalStylesPath, "utf8"),
    readFile(experiencePath, "utf8"),
  ]);
  const motionRule = styles.match(/\.story-card__motion\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(motionRule, /transform-style:\s*flat/);
  const activeRule = styles.match(/\.story-card\[data-card-active="true"\] \.story-card__motion\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(activeRule, /will-change:\s*transform;/);
  assert.doesNotMatch(experience, /autoAlpha:/);
  assert.match(experience, /"--story-reveal": "1"/);
  assert.match(styles, /opacity:\s*var\(--story-reveal, 0\)/);
});

test("pack fades keep a stable Three.js render mode", async () => {
  const source = await readFile(packScenePath, "utf8");

  assert.doesNotMatch(
    source,
    /material\.transparent\s*=\s*opacity/,
    "transparent must not change while a pack is fading",
  );
  assert.doesNotMatch(
    source,
    /material\.depthWrite\s*=\s*opacity/,
    "depthWrite must not change while a pack is fading",
  );
  assert.match(
    source,
    /configurePackRendering\(packB,\s*0\)/,
    "the rear pack must have an explicit render order",
  );
  assert.match(
    source,
    /configurePackRendering\(packA,\s*1\)/,
    "the front pack must have an explicit render order",
  );
  assert.match(
    source,
    /setPackRenderOrder\(packB,\s*permutationComplete \? 1 : 0\)/,
    "the purple pack must move to the foreground after the permutation",
  );
});

test("pack permutation completes before the depth handoff and fusion", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /permutation:\s*\[0\.235,\s*0\.285\]/);
  assert.match(configSource, /depthHandoff:\s*\[0\.285,\s*0\.33\]/);
  assert.match(configSource, /fusion:\s*\[0\.33,\s*0\.43\]/);
  assert.match(source, /packMotion\.permutation\.greenX,\s*permutation/);
  assert.match(source, /packMotion\.permutation\.purpleX,\s*permutation/);
  assert.match(source, /permutationArc \* packMotion\.permutation\.arcY/);
  assert.match(
    source,
    /setPackRenderOrder\(packA,\s*permutationComplete \? 0 : 1\)/,
  );
});

test("the purple pack remains the visible fusion survivor", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /greenMergeFade:\s*\[0\.39,\s*0\.43\]/);
  assert.match(
    source,
    /setOpacity\(\s*packA,\s*1\s*-\s*smoothstep\(rangeProgress\(progress,\s*packMotion\.ranges\.greenMergeFade\)\)/,
    "the rear green pack must fade during the merge",
  );
  assert.match(source, /setOpacity\(packB,\s*1\)/);
  assert.match(
    source,
    /packB\.transform\.scale\.setScalar\(\s*zoomScale \*\s*breathingScale \*\s*layoutTuning\.objectScale,?\s*\)/,
    "the foreground purple pack must own the final zoom while respecting the profile scale",
  );
  assert.match(
    source,
    /lerp\(purplePermutedZ, packMotion\.fusion\.purpleZ, fusion\) \+\s*lerp\(0, packMotion\.fusion\.zoomZ, zoom\)/,
    "the foreground purple pack must move toward the camera",
  );
});

test("hero packs drag independently and convert pointer speed into glow", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(source, /new THREE\.Raycaster\(\)/);
  assert.match(source, /raycaster\.intersectObject\(packA\.transform, true\)/);
  assert.match(source, /raycaster\.intersectObject\(packB\.transform, true\)/);
  assert.match(source, /const speed = Math\.hypot\(velocityX, velocityY\)/);
  assert.match(
    source,
    /state\.energy \* packMotion\.interaction\.emissiveBoost/,
  );
  assert.match(source, /state\.targetOffset\.set\(0, 0\)/);
  assert.match(source, /window\.addEventListener\("pointerdown", onPointerDown/);
  assert.doesNotMatch(
    source,
    /renderer\.domElement\.addEventListener\("pointerdown"/,
    "the full-screen canvas must not capture clicks outside the packs",
  );
  assert.match(configSource, /speedForMaxGlow:\s*1400/);
  assert.match(configSource, /reducedMotionTiltScale:\s*0\.2/);
});

test("sustained hard shaking overloads a hero pack into a glitch", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /glitch:\s*\{/);
  assert.match(
    source,
    /state\.energy >= tuning\.energyThreshold/,
    "only high-energy shaking may charge the glitch",
  );
  assert.match(source, /applyPackGlitch\(\s*packA,\s*dragA/);
  assert.match(source, /applyPackGlitch\(\s*packB,\s*dragB/);
  assert.match(
    source,
    /if \(reduceMotion\) return strength;/,
    "reduced motion must skip the glitch jumps",
  );
  assert.match(
    source,
    /strength <= 0 \|\| reducedMotionQuery\.matches/,
    "reduced motion must skip the screen-space shake and RGB split",
  );
});

test("keeping a glitched pack shaken mutates the whole viewport", async () => {
  const [source, configSource] = await Promise.all([
    readFile(packScenePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /viewportDelaySeconds:\s*2/);
  assert.match(
    source,
    /state\.glitch\.shakeTime >= packMotion\.glitch\.viewportDelaySeconds/,
    "the viewport stage needs 2s of shaking after the glitch starts",
  );
  assert.match(
    source,
    /!reducedMotionQuery\.matches &&/,
    "reduced motion must skip the viewport mutation",
  );
  assert.match(source, /viewportMutation\?\.dispose\(\)/);
});

test("the mutated viewport reveals the halloween apparition after 2s", async () => {
  const [mutationSource, configSource, styles] = await Promise.all([
    readFile(new URL("../components/experience/viewportMutation.ts", import.meta.url), "utf8"),
    readFile(configPath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(configSource, /terrorDelaySeconds:\s*2/);
  assert.match(configSource, /terrorSrc:\s*"\/assets\/halloween-easter-egg\.png"/);
  assert.match(mutationSource, /age >= tuning\.terrorDelaySeconds/);
  assert.match(
    styles,
    /\.viewport-mutation__terror\s*\{[^}]*mix-blend-mode:\s*screen/,
    "the apparition must blend over the page",
  );
});

test("GSAP's smoothed playhead is the single progress clock", async () => {
  const source = await readFile(experiencePath, "utf8");

  assert.doesNotMatch(
    source,
    /progressSignal\.set\(self\.progress\)/,
    "raw ScrollTrigger progress would desynchronise Three.js from GSAP scrub",
  );
  assert.match(
    source,
    /timeline\.eventCallback\(\s*"onUpdate"/,
    "the progress signal must follow the GSAP timeline playhead",
  );
});

test("story cards emerge from depth with a two-axis roll", async () => {
  const [source, configSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.match(configSource, /enterZ:\s*-620/);
  assert.match(configSource, /enterScale:\s*0\.72/);
  assert.match(configSource, /enterRotationX:\s*68/);
  assert.match(configSource, /enterRotationY:\s*28/);
  assert.match(source, /yawDirection:\s*-1\s*\|\s*1/);
  assert.match(
    source,
    /uiMotion\.enterRotationY\s*\*\s*yawDirection/,
    "the secondary axis must mirror the card's authored entry direction",
  );
});

test("the canvas layer owns the WebGL-to-video crossfade", async () => {
  const source = await readFile(packScenePath, "utf8");

  assert.doesNotMatch(
    source,
    /setOpacity\(\s*packA,\s*1\s*-\s*smoothstep\(\s*rangeProgress\(progress,\s*packMotion\.ranges\.webglFade\)/,
    "fading the model and its canvas at once creates a double fade",
  );
});

test("contract targets the current project", () => {
  assert.match(projectRoot, /mutable-soldiers-landing[\\/]$/);
});

test("one cinematic element scrubs the unified video across authored stops", async () => {
  const [assetsSource, configSource, mediaSource] = await Promise.all([
    readFile(assetsPath, "utf8"),
    readFile(configPath, "utf8"),
    readFile(mediaLayersPath, "utf8"),
  ]);

  assert.match(assetsSource, /src:\s*"\/assets\/scenes-cinematic\.mp4"/);
  assert.doesNotMatch(assetsSource, /scene-[1-4]-web\.webm/);
  assert.equal(
    Array.from(mediaSource.matchAll(/<video\b/g)).length,
    2,
    "the experience must render only the ambient and unified cinematic videos",
  );
  assert.match(configSource, /timeRange:\s*\[0, timeAtFrame\(3, 19\)\]/);
  assert.match(
    configSource,
    /timeRange:\s*\[timeAtFrame\(3, 19\), timeAtFrame\(6, 19\)\]/,
  );
  assert.match(configSource, /timeAtFrame\(10, 18\)/);
  assert.match(configSource, /timeAtFrame\(12, 3\)/);
  assert.match(mediaSource, /cinematicTimeForProgress\(progress\)/);
});

test("native wheel progress is not replaced by chapter navigation", async () => {
  const [source, configSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);

  assert.doesNotMatch(
    source,
    /useAssistedScroll/,
    "wheel, touch, and keyboard input must remain continuous",
  );
  assert.match(
    source,
    /scrub:\s*true/,
    "Lenis owns smoothing, so ScrollTrigger must track it without extra lag",
  );
  assert.doesNotMatch(
    configSource,
    /assistedScrollAnchors|assistedScroll:/,
    "chapter navigation configuration must not survive as dead code",
  );
});

test("the floating glass navbar keeps desktop inline and compact devices collapsible", async () => {
  const [navbarSource, experienceSource, stylesSource] = await Promise.all([
    readFile(navbarPath, "utf8"),
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(navbarSource, /<StaticGlassCard/);
  assert.match(navbarSource, /src="\/assets\/Logo-navbar\.svg"/);
  assert.doesNotMatch(navbarSource, />\s*MS\s*</);
  assert.match(navbarSource, /href="\/#hero"/);
  assert.match(navbarSource, /href="\/waitlist"/);
  assert.match(navbarSource, /\["Artists", "Drops"\]/);
  assert.match(navbarSource, /<CTAButton[\s\S]*?Connect Wallet/);
  assert.match(navbarSource, /disabled/);
  assert.match(navbarSource, /aria-expanded=\{menuOpen\}/);
  assert.match(navbarSource, /aria-controls="site-navigation-panel"/);
  assert.match(navbarSource, /event\.key !== "Escape"/);
  assert.match(navbarSource, /shellRef\.current\?\.contains/);
  assert.match(navbarSource, /site-navbar-nav--desktop/);
  assert.match(navbarSource, /site-navbar-nav--menu/);
  assert.match(navbarSource, /data-device=\{device\}/);
  assert.match(experienceSource, /<SiteNavbar device=\{layoutProfile\.device\} \/>/);
  assert.match(stylesSource, /@media \(min-width: 64rem\)/);
  assert.match(
    stylesSource,
    /\.site-navbar-shell:not\(\[data-device="mobile"\]\):not\(\[data-device="tablet"\]\)/,
  );
  assert.match(experienceSource, /<main[\s\S]*?id="hero"/);
  assert.match(
    stylesSource,
    /\.site-navbar-shell\s*{[^}]*position:\s*sticky;[^}]*top:\s*2rem;/s,
  );
});

test("the hero and desktop navbar share the wide-screen shell", async () => {
  const [experienceSource, stylesSource, tiltCardSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
    readFile(tiltCardPath, "utf8"),
  ]);
  const heroCardSource =
    experienceSource.match(
      /<StoryCardShell name="hero"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";

  assert.match(experienceSource, /from "@\/components\/spectrumui\/tilt-card"/);
  assert.match(heroCardSource, /<TiltCard[\s\S]*maxTilt=\{12\}/);
  assert.match(heroCardSource, /<TiltCard[\s\S]*unstyled/);
  assert.match(heroCardSource, /<TiltCardItem depth=\{96\}>/);
  assert.match(heroCardSource, /<TiltCardItem depth=\{68\}>/);
  assert.equal(
    heroCardSource.match(/<TiltCardItem depth=\{96\}>/g)?.length,
    2,
    "the hero title and CTAs must share the highest content plane",
  );
  assert.match(
    tiltCardSource,
    /data-tilt-hovered/,
    "the moving 3D card must resynchronise interactive hover targets",
  );
  assert.match(
    tiltCardSource,
    /unstyled\?: boolean/,
    "custom glass treatments must be able to opt out of Spectrum's opaque skin",
  );
  assert.match(
    tiltCardSource,
    /transformStyle:\s*"preserve-3d",\s*borderRadius:\s*"inherit"/,
    "the provider wrapper must pass the card radius through to custom surfaces",
  );
  assert.match(
    stylesSource,
    /\.cta-button\[data-tilt-hovered="true"\]/,
    "CTA visuals must respond to the tilt card's synchronised hover state",
  );
  assert.match(
    experienceSource,
    /className="spectrum-hero-card__surface"/,
    "the glass surface must be a separate layer so it cannot flatten the lifted content",
  );
  assert.doesNotMatch(
    experienceSource,
    /StoryCardShell name="hero"[\s\S]*?<GlassCard className="glass-card--hero">/,
  );
  assert.match(
    stylesSource,
    /\.story-card \.spectrum-hero-card-stage\s*{[^}]*pointer-events:\s*auto;/s,
    "the Spectrum tilt wrapper must receive pointer events inside the inert story overlay",
  );
  assert.doesNotMatch(
    stylesSource,
    /\.spectrum-hero-card\s*{[^}]*(?:overflow:\s*hidden|isolation:\s*isolate|backdrop-filter:)/s,
    "grouping properties on the rotating card would flatten its 3D descendants",
  );
  assert.match(
    stylesSource,
    /\.spectrum-hero-card__surface\s*{[^}]*overflow:\s*hidden;[^}]*backdrop-filter:/s,
    "clipping and backdrop blur belong on a separate visual surface",
  );
  assert.match(
    stylesSource,
    /:root\s*{[^}]*--experience-shell-max:/s,
    "wide-screen alignment needs one shared shell maximum",
  );
  assert.match(
    stylesSource,
    /\.site-navbar-shell\s*\{[^}]*width:\s*min\(calc\(100% - 4rem\),\s*30rem\)/s,
    "compact profiles need the deliberately narrow menu surface",
  );
  assert.match(
    stylesSource,
    /\.site-navbar-shell:not\(\[data-device="mobile"\]\):not\(\[data-device="tablet"\]\)\s*\{[^}]*width:\s*min\(calc\(100% - 4rem\),\s*var\(--experience-shell-max\)\)/s,
    "desktop restores the authored full-width navigation shell",
  );
  assert.match(
    stylesSource,
    /\.story-card--hero\s*{[^}]*left:[^;]*var\(--experience-shell-max\)/s,
    "the hero must stop drifting outside the navbar on wide screens",
  );
  assert.doesNotMatch(
    stylesSource,
    /\.story-card--hero\s*{[^}]*min-width:\s*34rem/s,
    "a fixed 34rem minimum creates empty horizontal space in the hero card",
  );
});

test("taxonomy cards combine their counts and lift supporting copy", async () => {
  const [experienceSource, glassCardSource, stylesSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(glassCardPath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(glassCardSource, /export function LayeredGlassCard/);
  assert.match(glassCardSource, /maxTilt = 12/);
  assert.match(glassCardSource, /<TiltCard[\s\S]*maxTilt=\{maxTilt\}/);
  assert.match(glassCardSource, /spectrum-hero-card__surface/);
  assert.equal(experienceSource.match(/<LayeredGlassCard/g)?.length, 5);
  assert.equal(experienceSource.match(/<TiltCardItem depth=\{56\}>/g)?.length, 3);
  assert.equal(experienceSource.match(/<TiltCardItem depth=\{96\}>/g)?.length, 8);
  assert.match(experienceSource, />9 Classes<\/h2>/);
  assert.match(experienceSource, />3 Rarities<\/h2>/);
  assert.match(experienceSource, />16 Artists<\/h2>/);
  assert.doesNotMatch(experienceSource, />16 Featured Artists<\/h2>/);
  assert.doesNotMatch(experienceSource, /className="story-number">(?:09|03|16)</);
  assert.match(
    stylesSource,
    /\.story-heading--single-line\s*{[^}]*white-space:\s*nowrap;/s,
  );
});

test("classes and rarities keep mirrored perspective at rest", async () => {
  const [experienceSource, glassCardSource, tiltCardSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(glassCardPath, "utf8"),
    readFile(tiltCardPath, "utf8"),
  ]);
  const classesSource =
    experienceSource.match(
      /<StoryCardShell name="classes"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";
  const raritiesSource =
    experienceSource.match(
      /<StoryCardShell name="rarities"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";

  assert.match(classesSource, /<LayeredGlassCard[\s\S]*?restRotateY=\{8\}/);
  assert.match(raritiesSource, /<LayeredGlassCard[\s\S]*?restRotateY=\{-8\}/);
  assert.match(glassCardSource, /restRotateY=\{restRotateY\}/);
  assert.match(tiltCardSource, /restRotateY\?: number/);
  assert.match(
    tiltCardSource,
    /useTransform\(pointerRotateY, \(value\) => value \+ restRotateY\)/,
    "pointer tilt must be additive around the authored resting perspective",
  );
  assert.match(
    tiltCardSource,
    /rotateY: shouldReduceMotion \? restRotateY : rotateY/,
    "reduced motion should preserve the static perspective without pointer animation",
  );
});

test("the artists card keeps a centered low-angle perspective", async () => {
  const [experienceSource, glassCardSource, tiltCardSource, stylesSource] =
    await Promise.all([
      readFile(experiencePath, "utf8"),
      readFile(glassCardPath, "utf8"),
      readFile(tiltCardPath, "utf8"),
      readFile(globalStylesPath, "utf8"),
    ]);
  const artistsSource =
    experienceSource.match(
      /<StoryCardShell name="artists"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";

  assert.match(
    artistsSource,
    /<LayeredGlassCard[\s\S]*restRotateX=\{10\}[\s\S]*maxTilt=\{4\}[\s\S]*perspective=\{650\}/,
  );
  assert.match(artistsSource, />16 Artists<\/h2>/);
  assert.match(
    artistsSource,
    /1\/1 Special NFTs crafted by some of the greatest artists[\s\S]*<br \/>[\s\S]*in this space\. Each of them representing their own essence through an\s*ARMY soldier\./,
  );
  assert.match(glassCardSource, /restRotateX=\{restRotateX\}/);
  assert.match(glassCardSource, /perspective=\{perspective\}/);
  assert.match(tiltCardSource, /restRotateX\?: number/);
  assert.match(
    tiltCardSource,
    /useTransform\(pointerRotateX, \(value\) => value \+ restRotateX\)/,
  );
  assert.match(
    tiltCardSource,
    /rotateX: shouldReduceMotion \? restRotateX : rotateX/,
  );
  assert.match(
    stylesSource,
    /\.glass-card--artists\s+:is\(h2, p\)\s*{[^}]*text-align:\s*center;/s,
  );
});

test("opening story cards use three ordered content planes", async () => {
  const [experienceSource, stylesSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);
  const twoPathsSource =
    experienceSource.match(
      /<StoryCardShell name="two-paths"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";
  const firstDropSource =
    experienceSource.match(
      /<StoryCardShell\s+name="first-drop"[\s\S]*?<\/StoryCardShell>/,
    )?.[0] ?? "";

  for (const cardSource of [twoPathsSource, firstDropSource]) {
    assert.match(cardSource, /<LayeredGlassCard/);
    assert.match(cardSource, /<TiltCardItem as="span" depth=\{40\}>/);
    assert.match(cardSource, /<TiltCardItem as="span" depth=\{72\}>/);
    assert.match(cardSource, /<TiltCardItem depth=\{96\}>/);
  }
  assert.match(twoPathsSource, /Two packs,/);
  assert.match(twoPathsSource, /Two paths/);
  assert.match(firstDropSource, /First Drop:/);
  assert.doesNotMatch(firstDropSource, /First Drop Reveal:/);
  assert.match(firstDropSource, /Soldiers of the/);
  assert.match(firstDropSource, /Ancient World/);
  assert.match(
    stylesSource,
    /\.spectrum-layered-card__heading\s*{[^}]*transform-style:\s*preserve-3d;/s,
  );
});

test("the final CTA and footer scroll as separate sections over the loop", async () => {
  const [footerSource, experienceSource, stylesSource] = await Promise.all([
    readFile(footerPath, "utf8"),
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(footerSource, /<StaticGlassCard/);
  assert.match(footerSource, /src="\/assets\/Logo\.svg"/);
  assert.match(footerSource, /href="\/#hero"/);
  assert.match(footerSource, /href="\/waitlist"/);
  assert.match(footerSource, /\["Artists", "Drops"\]/);
  assert.match(footerSource, /\["Army X", "Telegram", "xrp\.cafe"\]/);
  assert.match(footerSource, /disabled/);
  assert.match(experienceSource, /footer:\s*uiWindows\.footer/);
  assert.match(experienceSource, /<SiteFooter placement="closing" \/>/);
  assert.match(
    experienceSource,
    /closing-section closing-section--cta[\s\S]*?<TiltCard[\s\S]*?className="glass-card glass-card--final spectrum-hero-card spectrum-final-card"/,
  );
  assert.match(
    experienceSource,
    /<TiltCardItem as="span" depth=\{40\}>\s*Join the Ranks\./,
  );
  assert.match(
    experienceSource,
    /<TiltCardItem as="span" depth=\{72\}>\s*Secure your Spot\./,
  );
  assert.match(
    experienceSource,
    /closing-section closing-section--cta[\s\S]*?<TiltCardItem depth=\{96\}>[\s\S]*?<CTAButton>Join the WaitList<\/CTAButton>/,
  );
  assert.match(experienceSource, /className="closing-track" data-closing-track/);
  assert.match(
    experienceSource,
    /const storyEndPosition[\s\S]*querySelector<HTMLElement>\('\[data-layer="closing"\]'\)[\s\S]*offsetTop/,
    "the authored story must finish where the closing content actually begins",
  );
  assert.match(
    stylesSource,
    /\.closing-overlay\s*\{[^}]*position:\s*relative;[^}]*margin-top:\s*calc\(var\(--experience-story-vh, 1500vh\) - 100svh\);/s,
    "the closing content must scroll naturally over the sticky media stage",
  );
  assert.match(
    stylesSource,
    /\.closing-track\s*\{[^}]*position:\s*relative;/s,
  );
  assert.match(
    stylesSource,
    /\.closing-section\s*\{[^}]*min-height:\s*100svh;/s,
  );
  assert.match(
    stylesSource,
    /\.closing-section--footer\s*\{[^}]*min-height:\s*0;[^}]*padding-top:\s*clamp\(/s,
    "the footer must use its natural content height rather than another viewport",
  );
  assert.doesNotMatch(
    stylesSource,
    /\[data-orientation="portrait"\]\s+\[data-card="(?:hero|two-paths|first-drop|classes|rarities|artists|final)"\]/,
    "responsive story-card positioning must not leak into the closing sections",
  );
  assert.match(
    stylesSource,
    /\.ambient-video,\s*\.cinematic-video\s*\{[^}]*position:\s*absolute;/s,
  );
  const webglLayerTweens =
    experienceSource.match(
      /timeline\.to\(\s*'\[data-layer="webgl"\]'[\s\S]*?\n\s*\);/g,
    ) ?? [];
  assert.equal(
    webglLayerTweens.length,
    2,
    "the 3D packs should return behind the closing CTA after the cinematic",
  );
  assert.match(webglLayerTweens[0], /opacity:\s*0/);
  assert.match(webglLayerTweens[1], /opacity:\s*1/);
  assert.match(webglLayerTweens[1], /layerTransitions\.cinematicToAmbient\[0\]/);
});

test("the waitlist route reuses the landing system for an accessible XRPL lookup", async () => {
  const [pageSource, lookupSource, stylesSource] = await Promise.all([
    readFile(waitlistPagePath, "utf8"),
    readFile(waitlistLookupPath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(pageSource, /assetByKey\.ambient\.src/);
  assert.match(pageSource, /<SiteNavbar \/>/);
  assert.match(pageSource, /<SiteFooter placement="page" \/>/);
  assert.match(pageSource, /<WaitlistLookup \/>/);
  assert.match(lookupSource, /<GlassCard className="waitlist-check-card" flat>/);
  assert.match(lookupSource, /type="text"/);
  assert.match(lookupSource, /aria-invalid=/);
  assert.match(lookupSource, /aria-live="polite"/);
  assert.match(lookupSource, />Submit</);
  assert.doesNotMatch(lookupSource, /XRPL ACCESS CHECK/);
  assert.match(
    lookupSource,
    /Submitting your wallet address will not connect it\./,
  );
  assert.match(lookupSource, /\^r\[1-9A-HJ-NP-Za-km-z\]/);
  assert.match(
    stylesSource,
    /\.waitlist-check-card\s*{[^}]*width:[^;]*var\(--experience-shell-max\)/s,
  );
  assert.match(
    stylesSource,
    /\.waitlist-form__controls\s*{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s,
  );
  assert.match(
    stylesSource,
    /@media \(max-width: 760px\)[\s\S]*\.waitlist-form__controls\s*{[^}]*grid-template-columns:\s*1fr;/s,
  );
});
