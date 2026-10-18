// The fire below the page: it catches while the title forms (glow, then sparks), then a column of
// smoke rises up the screen as the title lands, revealing what it passes (the legend, then the
// rest of the hero), and the air over the fire starts to shimmer. Two canvases share one clock:
// the story layer under the hero, which scrolls with the page, and the flame layer fixed above
// everything but the grain.

import { createFlameLayer } from "./flameLayer";
import { IGNITION } from "./ignition";
import { createStoryLayer } from "./storyLayer";

/** Seconds from page load, on the same clock as the CSS intro (each ignition answers a title line). */
const TIMELINE = {
  // WebGL comes up in two small steps while the logo comes in, before the title starts.
  flameSetup: 1.6,
  storySetup: 1.8, // well before the smoke reaches the legend
  embers: IGNITION.try, // the try leaves a low glow and a few lazy sparks behind
  // A first, failed try: a warm pulse in the glow and a spark flicked up. Then the ignition that
  // takes (its own warm pulse is the flare) throws two more sparks up around…
  scout: IGNITION.try,
  // …it catching: the glow flares, sparks fly up in a volley, the air surges up and throws the
  // smoke column up the screen, once the whole title has been read.
  catch: IGNITION.take,
  glowIn: 1.5, // from embers to full glow, after catching
  swell: 1.2, // s after catching: burning hard, it starts carrying embers up
  smokeRise: 5.5, // until the column has left the top
  smokeOut: 1.8, // its fade once it nears the top
  hazeIn: 3, // the steady shimmer builds after the surge
  settle: IGNITION.take + 0.6, // the legend, left dim by the smoke, slowly comes up to full…
  settleIn: 5, // …over this long
};
/** The surge when it catches: near-instant attack, then it calms over about this long (s). */
const SURGE_DECAY = 1.1;
const EMBERS = 0.3; // glow and sparks before catching, of their full level
const WARMTH = 1.0; // the try's bump of warm light, on top of the embers' glow
/** The catch's flare: slower than the surge, so the light swells and lingers (s). */
const FLARE = { attack: 0.25, decay: 2.0 };

const HAZE_FADE = 0.8; // s: the band clears (no haze, blur or dimming) while the page end is in view
const BAND = 0.4; // of the screen: the bottom band where the air shimmers, blurs and darkens
/** The smoke front starts this far below the screen and ends this far above it (CSS px). */
const FRONT_OVERRUN = { below: 160, above: 500 };
const TO_TITLE = 0.8; // s for the smoke to reach the title, before it slows down

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const ramp = (t: number, start: number, duration: number) => clamp01((t - start) / duration);
const smooth = (n: number) => n * n * (3 - 2 * n);

/**
 * The smoke front's height on screen (px) at `since` s after catching: thrown up to the title
 * fast (TO_TITLE s, braking), then easing out over the rest of the climb (quadratic), starting at
 * the speed the first part ends with, so the change of pace is seamless.
 */
function smokeFront(since: number, start: number, title: number, end: number) {
  const rest = TIMELINE.smokeRise - TO_TITLE;
  // Second part: quadratic ease-out from the title to the end, and its starting speed.
  const speed = (2 * (title - end)) / rest;
  if (since <= 0) return start;
  if (since >= TO_TITLE) {
    const r = Math.min((since - TO_TITLE) / rest, 1);
    return title - (title - end) * (1 - (1 - r) ** 2);
  }
  // First part: constant braking from the speed that covers it in time to `speed` at the title.
  const kick = Math.max((2 * (start - title)) / TO_TITLE - speed, speed);
  const brake = (kick - speed) / TO_TITLE;
  return start - (kick * since - 0.5 * brake * since * since);
}

/** An envelope, 0–1-ish: an attack, then an exponential calm (both in s). */
const envelope = (since: number, attack: number, decay: number) =>
  since < 0 ? 0 : (1 - Math.exp(-since / attack)) * Math.exp(-since / decay);
/** The catch's surge: a sharp attack, then a quick calm. */
const surge = (since: number) => envelope(since, 0.08, SURGE_DECAY);

/** A soft bump peaking at 0, about `width` s wide. */
const pulse = (since: number, width: number) => Math.exp(-((since / width) ** 2));

/** The fire's breathing, 0–1: a few incommensurate sines, so it never visibly loops. */
const flicker = (t: number) =>
  0.5 + 0.25 * Math.sin(t * 1.7) + 0.15 * Math.sin(t * 2.9 + 1) + 0.1 * Math.sin(t * 5.3 + 2);

interface Options {
  storyCanvas: HTMLCanvasElement;
  flameCanvas: HTMLCanvasElement;
  story: HTMLElement;
  /** The smoke races up to it, then slows down. */
  title?: HTMLElement | null;
  /** Fades the haze out (the band's `data-cleared`). */
  cleared: () => boolean;
  /** The canvas draws the story (hide the DOM text) or stopped (show it again). */
  onActive: (active: boolean) => void;
  colors: { fire: string; bronze: string; ash: string };
  /** Elements the smoke reveals: each gets `data-revealed` once the smoke front passes it. */
  reveal: HTMLElement[];
  /** WebGL is unavailable or lost: nothing will reveal the elements. */
  onFail: () => void;
  /** Dev only: skip the intro and draw vertical reference lines in this color token. */
  debugLine?: string | undefined;
}

export function startFire(options: Options) {
  const { storyCanvas, flameCanvas, story, cleared, onActive, colors, debugLine } = options;
  const skip = debugLine ? 60 : 0; // debug: as if the intro were long over
  const at = (t: number, run: () => void) =>
    setTimeout(run, Math.max(0, (t - skip) * 1000 - performance.now()));
  let pending = [...options.reveal];

  let running = true;
  const fail = () => {
    running = false;
    onActive(false);
    options.onFail();
  };

  let flameLayer: ReturnType<typeof createFlameLayer> = null;
  let storyLayer: ReturnType<typeof createStoryLayer> = null;
  flameCanvas.addEventListener("webglcontextlost", fail);
  storyCanvas.addEventListener("webglcontextlost", fail);

  let clear = 1;
  let lift = 0;
  let last = performance.now();
  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const t = now / 1000 + skip;
    const time = t % 1000; // keeps the shader's noise inputs small
    const target = cleared() ? 0 : 1;
    clear += Math.sign(target - clear) * Math.min(Math.abs(target - clear), dt / HAZE_FADE);

    // Screen-space geometry from the visible screen (it changes as iOS toolbars come and go).
    const floor = window.innerHeight;
    const band = { top: floor * (1 - BAND), height: floor * BAND };
    // The surge: the air heating up all at once as the fire catches.
    const since = t - TIMELINE.catch;
    const rush = surge(since);
    // The hot air carries the smoke's shapes up: steady, much faster in the surge.
    lift += dt * (1 + 5 * rush);
    const front = smokeFront(
      t - TIMELINE.catch,
      floor + FRONT_OVERRUN.below,
      options.title?.getBoundingClientRect().bottom ?? floor * 0.3,
      -FRONT_OVERRUN.above,
    );
    const breath = flicker(t) + 0.5 * rush;
    const haze = ramp(t, TIMELINE.catch + 0.5, TIMELINE.hazeIn) ** 2 + 1.4 * rush;

    // Reveal what the smoke has passed (with a little lead, so it shows through the smoke).
    if (pending.length) {
      pending = pending.filter((el) => {
        const passed = el.getBoundingClientRect().top > front - 40;
        if (passed) el.toggleAttribute("data-revealed", true);
        return !passed;
      });
    }

    const air = { time, front, floor, band, lift, haze: haze * clear * (0.85 + 0.3 * breath) };
    const settle = smooth(ramp(t, TIMELINE.settle, TIMELINE.settleIn));
    storyLayer?.draw({ ...air, focus: clear, settle });
    const embers = EMBERS * smooth(ramp(t, TIMELINE.embers, 0.5));
    // The try: a short, bright bump as its spark comes into view. The catch: a slower flare.
    const bump = WARMTH * pulse(t - TIMELINE.scout - 0.08, 0.18);
    const flare = envelope(since, FLARE.attack, FLARE.decay) * 1.5;
    const full = smooth(ramp(t, TIMELINE.catch, TIMELINE.glowIn));
    const out = TIMELINE.catch + TIMELINE.smokeRise - TIMELINE.smokeOut;
    flameLayer?.draw({
      ...air,
      glow: embers + (1 - EMBERS) * full + bump + 0.9 * flare,
      // Both flashes run hot: toward orange, then back to the fire's red.
      flash: Math.min(bump + flare, 1),
      // Thick as it's thrown up, out (eased) as it nears the top.
      smoke:
        ramp(t, TIMELINE.catch, 0.3) *
        (1 + 0.6 * rush) *
        (1 - smooth(ramp(t, out, TIMELINE.smokeOut))),
      // No smoke before it catches: the failed try is only light and a spark.
      ambient: full,
      sparks: embers + (1 - EMBERS) * full,
      sparkTime: t - TIMELINE.embers,
      burst: since,
      swell: since - TIMELINE.swell,
      scout: t - TIMELINE.scout,
      flicker: breath,
    });
    requestAnimationFrame(frame);
  };

  at(TIMELINE.flameSetup, () => {
    flameLayer = createFlameLayer({ canvas: flameCanvas, colors });
    if (!flameLayer) return fail();
    requestAnimationFrame(frame);
  });
  // Fonts must be in before the words are measured and drawn.
  document.fonts.ready.then(() =>
    at(TIMELINE.storySetup, () => {
      if (!running) return;
      storyLayer = createStoryLayer({
        canvas: storyCanvas,
        story,
        smoke: colors.ash,
        onReady: () => onActive(true),
        debugLine,
      });
      if (!storyLayer) return fail();
      storyLayer.start();
    }),
  );
}
