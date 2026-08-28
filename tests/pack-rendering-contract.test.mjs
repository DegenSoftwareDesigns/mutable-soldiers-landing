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
const globalStylesPath = new URL("../app/globals.css", import.meta.url);
const glassCardStylesPath = new URL(
  "../assets/glass-tilt-card/GlassTiltCard.module.css",
  import.meta.url,
);

test("glass surfaces use the thicker shared backdrop blur", async () => {
  const [stylesSource, glassCardStylesSource] = await Promise.all([
    readFile(globalStylesPath, "utf8"),
    readFile(glassCardStylesPath, "utf8"),
  ]);
  const thickerBlur = /blur\(clamp\(52px,\s*4\.2vw,\s*68px\)\)/;

  assert.match(stylesSource, thickerBlur);
  assert.match(glassCardStylesSource, thickerBlur);
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
    /packB\.transform\.scale\.setScalar\(zoomScale \* breathingScale\)/,
    "the foreground purple pack must own the final zoom",
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

test("the floating glass navbar keeps its authored navigation contract", async () => {
  const [navbarSource, experienceSource, stylesSource] = await Promise.all([
    readFile(navbarPath, "utf8"),
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(navbarSource, /<GlassTiltCard/);
  assert.match(navbarSource, /src="\/assets\/Logo-navbar\.svg"/);
  assert.doesNotMatch(navbarSource, />\s*MS\s*</);
  assert.match(navbarSource, /href="\/#hero"/);
  assert.match(navbarSource, /href="\/waitlist"/);
  assert.match(navbarSource, /\["Artists", "Drops"\]/);
  assert.match(navbarSource, /<CTAButton>Connect Wallet<\/CTAButton>/);
  assert.match(navbarSource, /disabled/);
  assert.match(experienceSource, /<main id="hero"/);
  assert.match(experienceSource, /<SiteNavbar \/>/);
  assert.match(
    stylesSource,
    /\.site-navbar-shell\s*{[^}]*position:\s*sticky;[^}]*top:\s*2rem;/s,
  );
});

test("the hero card stays inside the same wide-screen shell as the navbar", async () => {
  const [experienceSource, stylesSource, tiltCardSource] = await Promise.all([
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
    readFile(tiltCardPath, "utf8"),
  ]);

  assert.match(experienceSource, /from "@\/components\/spectrumui\/tilt-card"/);
  assert.match(experienceSource, /<TiltCard[\s\S]*maxTilt=\{12\}/);
  assert.match(experienceSource, /<TiltCard[\s\S]*unstyled/);
  assert.match(experienceSource, /<TiltCardItem depth=\{96\}>/);
  assert.match(experienceSource, /<TiltCardItem depth=\{68\}>/);
  assert.equal(
    experienceSource.match(/<TiltCardItem depth=\{96\}>/g)?.length,
    3,
    "the hero title, hero CTAs, and final CTA must share the highest content plane",
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
    /\.site-navbar-shell\s*{[^}]*width:[^;]*var\(--experience-shell-max\)/s,
    "the navbar must use the shared shell",
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

test("the final scene includes a responsive glass footer on the shared shell", async () => {
  const [footerSource, experienceSource, stylesSource] = await Promise.all([
    readFile(footerPath, "utf8"),
    readFile(experiencePath, "utf8"),
    readFile(globalStylesPath, "utf8"),
  ]);

  assert.match(footerSource, /<GlassTiltCard/);
  assert.match(footerSource, /src="\/assets\/Logo\.svg"/);
  assert.match(footerSource, /href="\/#hero"/);
  assert.match(footerSource, /href="\/waitlist"/);
  assert.match(footerSource, /\["Artists", "Drops"\]/);
  assert.match(footerSource, /\["Army X", "Telegram", "xrp\.cafe"\]/);
  assert.match(footerSource, /disabled/);
  assert.match(experienceSource, /footer:\s*uiWindows\.final/);
  assert.match(experienceSource, /<SiteFooter \/>/);
  assert.match(
    experienceSource,
    /StoryCardShell name="final"[\s\S]*?<TiltCard[\s\S]*?className="glass-card glass-card--final spectrum-hero-card spectrum-final-card"/,
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
    /StoryCardShell name="final"[\s\S]*?<TiltCardItem depth=\{96\}>[\s\S]*?<CTAButton>Join the WaitList<\/CTAButton>/,
  );
  assert.match(experienceSource, /\[data-card="footer"\] \[data-card-motion\]/);
  assert.doesNotMatch(
    experienceSource,
    /reveal\(\s*'\[data-card="(?:final|footer)"\]/,
    "the final CTA and footer must not inherit the perspective reveal",
  );
  assert.match(
    experienceSource,
    /revealFlat\(\s*'\[data-card="footer"\]/,
    "the footer must enter through the flat reveal path",
  );
  assert.match(
    experienceSource,
    /revealFlat\(\s*'\[data-card="final"\]/,
    "the final CTA must enter through the flat reveal path",
  );
  assert.match(
    experienceSource,
    /const revealFlat[\s\S]*rotation:\s*0,[\s\S]*skewX:\s*0,[\s\S]*skewY:\s*0,/,
    "the flat reveal must clear GSAP's decomposed 2D rotation and skew",
  );
  assert.match(
    stylesSource,
    /\.site-footer\s*{[^}]*width:[^;]*var\(--experience-shell-max\)/s,
  );
  assert.match(
    stylesSource,
    /\.site-footer__motion\s*{[^}]*transform-style:\s*flat;/s,
  );
  assert.match(
    stylesSource,
    /\.glass-card-stage--flat\s*{[^}]*perspective:\s*none;/s,
  );
  assert.match(
    stylesSource,
    /\.glass-card--flat-surface\s*{[^}]*transform:\s*none\s*!important;/s,
  );
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
