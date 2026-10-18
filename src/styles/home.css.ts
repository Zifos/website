import { createVar, fallbackVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { TITLE_LINES } from "@/components/fire/ignition";
import { vars } from "@/styles/theme.css";

// Temp home: a title sequence over a fire burning just below the screen, then the legend peeking
// from below the fold. Timeline (s): logo reveal 0.2–2.0 · the title in two steps, one line at a
// time; as each is landing, the fire below answers it (IGNITION: the failed try, then the one that
// takes) · the fire's smoke reveals the rest: the legend, the areas, the contact and the language
// switch (`data-fire`, below). Without it (reduced motion, no WebGL) those fade in on their own:
// areas 5.0 · contact and language 5.4 · story STORY_DELAY.
const LETTER_START = TITLE_LINES[0];
const LETTER_STAGGER = 0.035;
const LINE_STAGGER = TITLE_LINES[1] - TITLE_LINES[0];
const RESOLVE_DURATION = 1.0;
const TRACK_DURATION = 1.6;
// Extra gap per letter at the start of the tracking-in: small, so even the outer letters of the
// longest line start on a phone screen.
const TRACK_SPREAD = "0.1em";
const MAX_LETTERS = 24; // per line
const MAX_LINES = 3;
const STORY_DELAY = 5.8; // s, after the tracking-in has settled
const STORY_DURATION = 2.4; // s, a slow rise out of the blur

// Letter position from each end of its line, so each line tracks in toward its own center.
const fromStart = createVar();
const fromEnd = createVar();
const lineDelay = createVar();

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

// Hierarchy: the title leads; the logo sits above it at ~2/5 of its width on phones and ~1/4 on
// wide screens, like a studio card. Capped at 200px: past that, the regular logo variant applies.
export const logo = style({
  width: "clamp(7.5rem, 15vw, 12.5rem)",
  height: "auto",
  color: vars.color.textSecondary,
  animation: `${logoReveal} 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both`,
});

export const title = style({
  position: "relative",
  // Instrument Serif is condensed: the longest line ("escribimos poemas") is ~6em wide, so 13vw
  // fits a phone screen with the hero padding.
  fontSize: "clamp(2.5rem, 13vw, 7.5rem)",
  fontWeight: 400,
  lineHeight: 1,
  textAlign: "center",
  letterSpacing: "-0.02em",
});

// Lines never wrap: the copy sets the breaks, sized so the longest line fits a phone.
export const titleLine = style({
  position: "relative",
  display: "block",
  whiteSpace: "nowrap",
  vars: { [lineDelay]: "0s" },
});

// The title as plain text, invisible, exactly over its animated letters: what gets selected and
// copied (as one phrase, see Home.astro), with one continuous highlight (letter boxes leave gaps)
// in the font's real kerning. Selected, it shows in the selection colors over
// the letters below.
export const titleText = style({
  position: "absolute",
  inset: 0,
  // As wide as its widest line, centered: the phrase wraps exactly between its lines.
  width: "min-content",
  marginInline: "auto",
  color: "transparent",
});

// One phrase, its lines unbreakable and joined by a plain space (no <br>, which ends a paragraph
// for selection): a triple-click selects the whole title.
export const titleTextLine = style({
  whiteSpace: "nowrap",
});

for (let n = 2; n <= MAX_LINES; n++) {
  globalStyle(`${titleLine}:nth-child(${n})`, {
    vars: { [lineDelay]: `${((n - 1) * LINE_STAGGER).toFixed(2)}s` },
  });
}

// Per-letter kerning (em), set by the script in Home.astro: separate boxes lose the font's kerning,
// so each letter is nudged to where plain text (titleText) puts it.
export const letterKern = createVar();

export const letter = style({
  display: "inline-block",
  whiteSpace: "pre",
  // See titleText. Safari only knows the prefixed property.
  WebkitUserSelect: "none",
  userSelect: "none",
  marginInlineStart: fallbackVar(letterKern, "0"),
  willChange: "translate, transform, opacity, filter",
  // `resolve` animates transform, `trackIn` animates translate — they compose.
  animation: [
    `${resolve} ${RESOLVE_DURATION}s cubic-bezier(0.16, 1, 0.3, 1) both`,
    `${trackIn} ${TRACK_DURATION}s cubic-bezier(0.16, 1, 0.3, 1) both`,
  ].join(", "),
});

for (let n = 1; n <= MAX_LETTERS; n++) {
  const delay = (LETTER_START + (n - 1) * LETTER_STAGGER).toFixed(2);
  globalStyle(`${letter}:nth-child(${n})`, {
    vars: { [fromStart]: String(n) },
    // Each line tracks in from its own start.
    animationDelay: `calc(${lineDelay} + ${delay}s), calc(${lineDelay} + ${LETTER_START}s)`,
  });
  globalStyle(`${letter}:nth-last-child(${n})`, {
    vars: { [fromEnd]: String(n) },
  });
}

// What we do, under the title: a quiet credits line in the sans, before the story arrives.
export const areas = style({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  rowGap: "0.25em",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: vars.font.sans,
  fontSize: "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
  animation: `${fadeIn} 1.2s ease-out 5s both`,
  "@media": {
    // Too narrow for one line (~26rem): two rows, dots aligned in a column, never one opening a row.
    "(max-width: 36rem)": {
      display: "grid",
      gridTemplateColumns: "auto auto",
      justifyContent: "center",
    },
  },
});

export const area = style({
  selectors: {
    // Middle dot between areas.
    "& + &::before": {
      content: "·",
      marginInline: "0.75em",
    },
  },
  "@media": {
    "(max-width: 36rem)": {
      selectors: {
        "&:nth-child(odd)": { justifySelf: "end" },
        "&:nth-child(odd)::before": { content: "none" },
      },
    },
  },
});

// Top-right, over the hero (same layer, later in the DOM); arrives with the story so it never
// competes with the intro.
export const languageSwitch = style({
  position: "absolute",
  top: `clamp(${vars.space.md}, 3vw, ${vars.space.lg})`,
  insetInlineEnd: `clamp(${vars.space.md}, 4vw, ${vars.space.lg})`,
  zIndex: 2,
  animation: `${fadeIn} 1.2s ease-out 5.4s both`,
});

export const story = style({
  // Prose measure: ~60–66 characters per line on wide screens; on phones the screen is the limit.
  maxWidth: "48ch", // DM Sans fits ~1.4 characters per `ch`, so this lands at ~66 max
  marginInline: "auto",
  paddingInline: `clamp(${vars.space.md}, 5vw, ${vars.space.lg})`,
  paddingBlockStart: vars.space.md,
  // Body copy in the sans (brand/05-tipografia.md); the title keeps the serif via the heading rule.
  fontFamily: vars.font.sans,
  fontSize: "clamp(1.0625rem, 0.95rem + 0.4vw, 1.25rem)",
  lineHeight: 1.65,
  // Softer than the hero: the legend glows in the firelight rather than competing with the title.
  // The fire's canvas paints with this computed color too.
  color: `color-mix(in oklab, ${vars.color.text} 72%, ${vars.color.background})`,
  // Appears once the whole intro has landed, slowly, so it doesn't compete with it.
  animation: `${fadeIn} ${STORY_DURATION}s ease-out ${STORY_DELAY}s both`,
});

export const storyTitle = style({
  marginBlockEnd: "1.25em",
  fontSize: "clamp(2.25rem, 8vw, 3.5rem)",
  fontStyle: "italic",
  lineHeight: 1.1,
  textAlign: "center",
});

// Closes the hero, a step further from the areas than the hero's own gap; arrives with the
// story. Inside the hero, so it shares its layer above the focus gradient (never blurred).
export const contact = style({
  display: "flex",
  justifyContent: "center",
  maxWidth: "100%",
  marginBlockStart: vars.space.md,
  animation: `${fadeIn} 1.2s ease-out 5.4s both`,
});

// After the legend's last line: a quiet way back up, styled like the language switch.
export const footer = style({
  display: "flex",
  justifyContent: "center",
  paddingInline: vars.space.md,
  // A clear pause after the legend's last line, so the link reads as leaving the story.
  paddingBlockStart: "clamp(4rem, 12vh, 7rem)",
  // Just breathing room: the focus gradient clears once the page end is in view (see Home.astro),
  // so nothing needs to scroll up out of it.
  paddingBlockEnd: "clamp(3rem, 10svh, 6rem)",
});

export const backToTop = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5em",
  padding: "0.5em 0.25em",
  fontFamily: vars.font.sans,
  fontSize: "0.8125rem",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: vars.color.textSecondary,
  textDecoration: "none",
  transition: "color 0.2s ease",
  selectors: {
    "&:hover": { color: vars.color.text },
    "&:focus-visible": { outline: "1px solid currentColor", outlineOffset: "2px" },
  },
});

export const backToTopIcon = style({
  width: "1.125em",
  height: "1.125em",
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
  transition: "opacity 0.8s ease",
  // Dim toward the edge: the darkening paints over the blurred text.
  selectors: {
    // The page end is in view: the band fades out so the last lines read sharp.
    "&[data-cleared]": { opacity: 0 },
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

// The fire (components/fire), on two canvases sized to the large viewport (`lvh`: the screen with
// iOS toolbars collapsed), so they never resize as the toolbars come and go. The legend's layer
// is a window over the page, taller than the screen and moved along by the script, so it scrolls
// natively with the text; it shares the band's layer under the hero. The flame layer (glow,
// smoke, sparks) is fixed over the hero too, under the grain, with room below for the bounce.
// Both stay empty without the script; the fire's own clock times their entrance.
export const storyCanvas = style({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "140lvh", // OVERSCAN in storyLayer.ts
  zIndex: 1,
  pointerEvents: "none",
  willChange: "transform",
});

export const flameCanvas = style({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "115lvh",
  zIndex: 2,
  pointerEvents: "none",
});

// While the canvas draws the text, the DOM copy only keeps its layout, selection and semantics,
// and the fire's shader does the band's blur and dimming (no backdrop filters to keep up with).
// Fill color, not `color`: the script reads each element's color to paint it.
globalStyle(`${page}[data-haze-on] ${story}`, {
  WebkitTextFillColor: "transparent",
});
globalStyle(`${page}[data-haze-on] ${focusGradient}`, {
  visibility: "hidden",
});

// With the fire running, the smoke reveals these (the script sets `data-revealed` as the smoke
// front passes each one) instead of their timed entrances.
const smokeRevealed = [areas, contact, languageSwitch];
globalStyle(smokeRevealed.map((el) => `${page}[data-fire] ${el}`).join(", "), {
  animation: "none",
  opacity: 0,
  filter: "blur(8px)",
  transition: "opacity 1.4s ease-out, filter 1.4s ease-out",
});
globalStyle(smokeRevealed.map((el) => `${page}[data-fire] ${el}[data-revealed]`).join(", "), {
  opacity: 1,
  filter: "blur(0)",
});

// Respect reduced motion: show the final frame.
globalStyle(`${logo}, ${letter}, ${areas}, ${story}, ${languageSwitch}, ${contact}`, {
  "@media": {
    "(prefers-reduced-motion: reduce)": { animation: "none" },
  },
});
