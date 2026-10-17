import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// Temp home: a film-intro title sequence, then the legend peeking from below the fold.
// Timeline (s): bars open 0–1.6 · logo reveal 1.0–3.4 (alone on stage) · title letters from 2.6
// · tracking-in 2.6–6.2 · story 4.6.
const LETTER_START = 2.6;
const LETTER_STAGGER = 0.08;
const TRACK_DURATION = 3.6;
const TRACK_SPREAD = "0.47em"; // extra gap per letter at the start of the tracking-in
const MAX_LETTERS = 40;

// Letter position from each end, so the offset from the center works for any title length.
const fromStart = createVar();
const fromEnd = createVar();

const fadeIn = keyframes({
  from: { opacity: 0, filter: "blur(8px)" },
  to: { opacity: 1, filter: "blur(0)" },
});

// The logo's own reveal, slow and dramatic: it emerges from deep blur, settling down from a
// larger scale, and holds the stage alone before the title starts.
const logoReveal = keyframes({
  "0%": { opacity: 0, filter: "blur(20px)", transform: "scale(1.15)" },
  "40%": { opacity: 0.6, filter: "blur(8px)" },
  "100%": { opacity: 1, filter: "blur(0)", transform: "none" },
});

const resolve = keyframes({
  from: { opacity: 0, filter: "blur(14px)", transform: "translateY(0.12em) scale(1.08)" },
  to: { opacity: 1, filter: "blur(0)", transform: "none" },
});

// Tracking-in via `translate` (composited, sub-pixel) rather than letter-spacing, which
// re-lays out text and snaps glyphs to whole pixels — visible as stepping at the slow tail.
const trackIn = keyframes({
  from: { translate: `calc((${fromStart} - ${fromEnd}) / 2 * ${TRACK_SPREAD}) 0` },
  to: { translate: "0 0" },
});

const openBar = keyframes({
  from: { height: "50%" },
  to: { height: 0 },
});

// Static noise texture in two layers (feColorMatrix maps fractal noise to alpha, no grey veil):
// dark specks show on the light letters, light specks show on the dark background.
// Strength lives in the alpha row's last two values; tune there, not with element opacity.
const NOISE_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='1' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 -0.15'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const NOISE_LIGHT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.12 -0.04'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const page = style({
  // Force the dark palette: every light-dark() token resolves to its dark value.
  colorScheme: "dark",
  position: "relative",
  isolation: "isolate",
  overflowX: "clip",
  color: vars.color.text,
  backgroundColor: vars.color.background,
  selectors: {
    // Subtle noise texture over everything, spanning the whole page so it scrolls with the
    // content (the specks stay locked to the letters instead of sliding over them).
    "&::after": {
      content: "",
      position: "absolute",
      inset: 0,
      zIndex: 2,
      pointerEvents: "none",
      backgroundImage: `${NOISE_DARK}, ${NOISE_LIGHT}`,
      backgroundSize: "180px",
    },
  },
});

// Curtain bars over the whole viewport: start closed (black screen), then retract fully.
export const curtain = style({
  position: "fixed",
  inset: 0,
  zIndex: 3,
  pointerEvents: "none",
  selectors: {
    "&::before, &::after": {
      content: "",
      position: "absolute",
      insetInline: 0,
      height: 0,
      backgroundColor: vars.color.background,
      animation: `${openBar} 1.6s cubic-bezier(0.65, 0, 0.35, 1) both`,
    },
    "&::before": { top: 0 },
    "&::after": { bottom: 0 },
  },
});

export const hero = style({
  // Above the focus gradient (z 1): the band never blurs the title or re-composites the hero's
  // background gradients (which caused banding on some desktop GPUs). The noise (z 2, later in
  // the DOM) still paints over it.
  position: "relative",
  zIndex: 2,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "clamp(1.5rem, 4vh, 3rem)",
  // Shorter than the screen so the legend's title and first paragraph peek in at the bottom
  // (fixed peek height, so it holds the same content on any screen; never below 60% of it).
  minHeight: "max(60svh, calc(100svh - 15rem))",
  padding: vars.space.lg,
  backgroundColor: vars.color.surface,
  backgroundImage: [
    `linear-gradient(to bottom, transparent 70%, ${vars.color.background})`,
    `radial-gradient(ellipse at center, transparent 35%, ${vars.color.background} 100%)`,
  ].join(", "),
});

// Hierarchy: the title leads; the logo sits above it at ~1/3 of its width, like a studio card.
export const logo = style({
  width: "clamp(6rem, 13vw, 11rem)",
  height: "auto",
  color: vars.color.textSecondary,
  animation: `${logoReveal} 2.4s cubic-bezier(0.22, 1, 0.36, 1) 1s both`,
});

export const title = style({
  // Instrument Serif is condensed: "we are back" is ~3.8em wide, so 20vw fills most of a phone screen.
  fontSize: "clamp(3.5rem, 20vw, 9rem)",
  fontWeight: 400,
  lineHeight: 1,
  textAlign: "center",
  letterSpacing: "-0.02em",
});

export const letter = style({
  display: "inline-block",
  whiteSpace: "pre",
  willChange: "translate, transform, opacity, filter",
  // `resolve` animates transform, `trackIn` animates translate — they compose.
  animation: [
    `${resolve} 1.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
    `${trackIn} ${TRACK_DURATION}s cubic-bezier(0.16, 1, 0.3, 1) ${LETTER_START}s both`,
  ].join(", "),
});

for (let n = 1; n <= MAX_LETTERS; n++) {
  const delay = (LETTER_START + (n - 1) * LETTER_STAGGER).toFixed(2);
  globalStyle(`${letter}:nth-child(${n})`, {
    vars: { [fromStart]: String(n) },
    animationDelay: `${delay}s, ${LETTER_START}s`,
  });
  globalStyle(`${letter}:nth-last-child(${n})`, {
    vars: { [fromEnd]: String(n) },
  });
}

export const story = style({
  // Prose measure: ~60–66 characters per line on wide screens; on phones the screen is the limit.
  maxWidth: "48ch", // DM Sans fits ~1.4 characters per `ch`, so this lands at ~66 max
  marginInline: "auto",
  paddingInline: `clamp(${vars.space.md}, 5vw, ${vars.space.lg})`,
  paddingBlockStart: vars.space.md,
  // Room to scroll the last paragraph up out of the focus gradient (bottom 40svh of the screen).
  paddingBlockEnd: "46svh",
  // Body copy in the sans (brand/05-tipografia.md); the title keeps the serif via the heading rule.
  fontFamily: vars.font.sans,
  fontSize: "clamp(1.0625rem, 0.95rem + 0.4vw, 1.25rem)",
  lineHeight: 1.65,
  // Appears once the title has landed, so it doesn't compete with the intro.
  animation: `${fadeIn} 1.2s ease-out 4.6s both`,
});

export const storyTitle = style({
  marginBlockEnd: "1.25em",
  fontSize: "clamp(2.25rem, 8vw, 3.5rem)",
  fontStyle: "italic",
  lineHeight: 1.1,
  textAlign: "center",
});

globalStyle(`${story} p`, {
  marginBlockEnd: "1.1em",
  textWrap: "pretty",
});

// Focus gradient: a band fixed over the bottom half of the screen that blurs and dims what scrolls
// through it, progressively toward the bottom edge. A single backdrop blur can only crossfade
// sharp↔blurred, so layers of increasing blur fade in one after another (stacked backdrop
// filters compound), giving a true progressive blur. Sits under the noise, so the grain stays crisp.
export const FOCUS_LAYERS = [2, 2.5, 3, 3.5, 5]; // px each layer adds; stacked ≈ √Σb² → 2, 3.2, 4.4, 5.6, 7.5px (near-linear ramp)
const FOCUS_BAND = 100 / FOCUS_LAYERS.length; // % of the band over which each layer fades in

export const focusGradient = style({
  position: "fixed",
  insetInline: 0,
  bottom: 0,
  height: "40svh",
  zIndex: 1,
  pointerEvents: "none",
  // Dim toward the edge: the darkening paints over the blurred text.
  selectors: {
    "&::after": {
      content: "",
      position: "absolute",
      inset: 0,
      // Gentle ease-out: dims a little faster at first, then steadily toward the edge.
      backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in oklab, ${vars.color.background} 35%, transparent) 40%, color-mix(in oklab, ${vars.color.background} 85%, transparent))`,
    },
  },
});

export const focusLayer = style({
  position: "absolute",
  inset: 0,
});

FOCUS_LAYERS.forEach((blur, i) => {
  const start = i * FOCUS_BAND;
  const mask = `linear-gradient(to bottom, transparent ${start}%, black ${start + FOCUS_BAND}%)`;
  globalStyle(`${focusLayer}:nth-child(${i + 1})`, {
    // Unprefixed only: the build's CSS minifier adds -webkit- prefixes itself, and writing both
    // by hand made it drop the standard property.
    backdropFilter: `blur(${blur}px)`,
    maskImage: mask,
  });
});

// Respect reduced motion: show the final frame.
globalStyle(`${curtain}::before, ${curtain}::after, ${logo}, ${letter}, ${story}`, {
  "@media": {
    "(prefers-reduced-motion: reduce)": { animation: "none" },
  },
});
