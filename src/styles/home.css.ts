import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme.css";

// Temp hero: a film-intro title sequence.
// Timeline (s): bars open 0–1.6 · logo 1.0–2.4 · letters from 1.6 · tracking-in 1.6–5.2.
const LETTER_START = 1.6;
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

const grainShift = keyframes({
  "0%": { transform: "translate(0, 0)" },
  "25%": { transform: "translate(-3%, 2%)" },
  "50%": { transform: "translate(2%, -3%)" },
  "75%": { transform: "translate(-2%, -1%)" },
  "100%": { transform: "translate(3%, 3%)" },
});

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const main = style({
  // Force the dark palette inside the hero: every light-dark() token resolves to its dark value.
  colorScheme: "dark",
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "clamp(1.5rem, 4vh, 3rem)",
  minHeight: "100dvh",
  padding: vars.space.lg,
  color: vars.color.text,
  backgroundColor: vars.color.surface,
  backgroundImage: `radial-gradient(ellipse at center, transparent 35%, ${vars.color.background} 100%)`,
  selectors: {
    // Film grain.
    "&::after": {
      content: "",
      position: "absolute",
      inset: "-10%",
      zIndex: 2,
      pointerEvents: "none",
      backgroundImage: GRAIN,
      opacity: 0.09,
      mixBlendMode: "overlay",
      animation: `${grainShift} 0.6s steps(1) infinite`,
    },
  },
});

// Curtain bars: start closed (black screen), then retract fully so the frame goes edge to edge.
export const bars = style({
  position: "absolute",
  inset: 0,
  zIndex: 1,
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

// Hierarchy: the title leads; the logo sits above it at ~1/3 of its width, like a studio card.
export const logo = style({
  width: "clamp(6rem, 13vw, 11rem)",
  height: "auto",
  color: vars.color.textSecondary,
  animation: `${fadeIn} 1.4s ease-out 1s both`,
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

// Respect reduced motion: show the final frame, no grain jitter.
globalStyle(`${main}::after, ${bars}::before, ${bars}::after, ${logo}, ${letter}`, {
  "@media": {
    "(prefers-reduced-motion: reduce)": { animation: "none" },
  },
});
