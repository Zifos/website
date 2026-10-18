// The story layer: the legend drawn on a canvas, revealed where the smoke has passed, and toward
// the bottom of the screen distorted by the rising air, blurred and sunk into the dark. The DOM
// text stays in place (invisible) for layout, selection and screen readers: its word positions
// are read back and painted into a texture, so the canvas matches the browser's own layout.
//
// The canvas lives in page coordinates (a window a bit taller than the screen, moved along as
// the page scrolls), not fixed to the screen: the browser scrolls it with the text on its own
// thread, so it never trails the scroll. Only the screen-anchored effects can be a frame late.

import { createLayer, glsl, HAZE, NOISE, resolveColor, SMOKE_FRONT, VIEW } from "./gl";

const FRESH = 260; // px behind the smoke front over which the text cools from smoke to its color
const SETTLE_FROM = 0.35; // the legend's opacity as the smoke leaves it, before it settles
const BLUR = 7.5; // px of blur radius at the bottom of the band, easing in from its top
const BLUR_TAPS = 16;
/** The canvas is this much taller than the screen, split above and below it. */
const OVERSCAN = 0.4;
const MAX_PIXEL_RATIO = 2;
const MAX_TEXTURE_PIXELS = 16_000_000; // iOS caps a 2D canvas at ~16.7M pixels

const ringTaps = Array.from({ length: BLUR_TAPS }, (_, i) => {
  // Golden-angle spiral: evenly spread over the disk.
  const angle = i * 2.39996323;
  const r = Math.sqrt((i + 0.5) / BLUR_TAPS);
  return `    sum += text(q + rot * vec2(${glsl(Math.cos(angle) * r)}, ${glsl(Math.sin(angle) * r)}) * radius);`;
}).join("\n");

const FRAGMENT = `${VIEW}
uniform sampler2D uText;
uniform vec2 uOrigin;   // story's top-left on screen, CSS px
uniform vec2 uSize;     // story size covered by the texture, CSS px
uniform vec3 uSmoke;    // color of freshly revealed text
uniform float uSettle;  // 0–1: after the smoke, the legend slowly comes up to full
uniform float uFocus;   // 0–1: the band's blur and dimming (0 at the page end, so it reads sharp)
${NOISE}
${HAZE}
${SMOKE_FRONT}

vec4 text(vec2 p) { return texture2D(uText, (p - uOrigin) / uSize); }

void main() {
  vec2 q = haze(screen());
  float band = clamp((q.y - uBand.x) / uBand.y, 0.0, 1.0);

  // Progressive blur: a disk of taps growing toward the bottom, turned per pixel so the taps'
  // pattern dissolves into the grain.
  float radius = ${glsl(BLUR)} * band * uFocus;
  vec4 color;
  if (radius > 0.4) {
    float a = fract(sin(dot(gl_FragCoord.xy, vec2(41.3, 289.1))) * 43758.5453) * 6.2831853;
    mat2 rot = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec4 sum = vec4(0.0);
${ringTaps}
    color = sum / ${glsl(BLUR_TAPS)};
  } else {
    color = text(q);
  }

  // The smoke leaves the text behind: hidden ahead of the front, smoke-colored just behind it.
  float behind = smokeBehind(q);
  float fresh = 1.0 - smoothstep(0.0, ${glsl(FRESH)}, behind);
  color.rgb = mix(color.rgb, uSmoke * color.a, fresh * 0.75);
  color *= smoothstep(-20.0, 40.0, behind) * mix(${glsl(SETTLE_FROM)}, 1.0, uSettle);

  // Sinks into the dark toward the bottom (the page background shows through): 35% dimmer at
  // 40% of the band, 85% at its bottom.
  float dim = band < 0.4 ? band / 0.4 * 0.35 : mix(0.35, 0.85, (band - 0.4) / 0.6);
  color *= 1.0 - dim * uFocus;

  gl_FragColor = color;
}
`;

interface StoryFrame {
  time: number;
  front: number;
  haze: number;
  /** Haze band top and height on screen, CSS px. */
  band: { top: number; height: number };
  floor: number;
  focus: number;
  lift: number;
  settle: number;
}

interface Options {
  canvas: HTMLCanvasElement;
  /** The text to draw; its layout is the source of truth. */
  story: HTMLElement;
  /** Color token for text just left behind by the smoke. */
  smoke: string;
  /** Called once the canvas holds the story (hide the DOM text). */
  onReady: () => void;
}

export function createStoryLayer({ canvas, story, smoke, onReady }: Options) {
  const ratio = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const layer = createLayer(canvas, FRAGMENT, ratio);
  const raster = document.createElement("canvas");
  const ctx = raster.getContext("2d");
  if (!layer || !ctx) return null;
  const { gl, uniform } = layer;

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const u = {
    origin: uniform("uOrigin"),
    size: uniform("uSize"),
    band: uniform("uBand"),
    floor: uniform("uFloor"),
    focus: uniform("uFocus"),
    lift: uniform("uLift"),
    settle: uniform("uSettle"),
    time: uniform("uTime"),
    front: uniform("uFront"),
    haze: uniform("uHaze"),
  };
  gl.uniform3f(uniform("uSmoke"), ...resolveColor(smoke, canvas));

  // Snap to device pixels, so undistorted text samples texel centers and stays crisp.
  const snap = (n: number) => Math.round(n * ratio) / ratio;

  // Keep the canvas window around the screen: move it (page coordinates, within its page-sized
  // frame) only once the scroll has used up half its overscan, and never past the page's end.
  const page = canvas.parentElement;
  let at = Number.NaN;
  const place = () => {
    if (!page) return;
    const height = canvas.offsetHeight;
    const margin = (height * OVERSCAN) / (2 * (1 + OVERSCAN));
    const scrolled = -page.getBoundingClientRect().top;
    const end = Math.max(page.offsetHeight - height, 0);
    const target = Math.round(Math.min(Math.max(scrolled - margin, 0), end));
    // At either end, or left beyond the end (the page or screen changed size): move right away.
    const pinned = target === 0 || target === end || at > end;
    if (target === at || (!pinned && Math.abs(target - at) < margin / 2)) return;
    at = target;
    canvas.style.transform = `translate3d(0, ${at}px, 0)`;
  };

  // Paint every word where the browser laid it out, in the story's own coordinates.
  let size = { width: 0, height: 0 };
  const paint = () => {
    const box = story.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const scale = Math.min(
      ratio,
      Math.sqrt(MAX_TEXTURE_PIXELS / (box.width * box.height)),
      maxTexture / box.width,
      maxTexture / box.height,
    );
    raster.width = Math.ceil(box.width * scale);
    raster.height = Math.ceil(box.height * scale);
    size = { width: raster.width / scale, height: raster.height / scale };
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.textBaseline = "alphabetic";

    const range = document.createRange();
    const walker = document.createTreeWalker(story, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const parent = node.parentElement;
      if (!parent || !text.trim()) continue;
      const style = getComputedStyle(parent);
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      // A range's rect is the font's content area: the baseline sits one ascent below its top.
      const metrics = ctx.measureText(text);
      const ascent = metrics.fontBoundingBoxAscent ?? Number.parseFloat(style.fontSize) * 0.8;
      for (const word of text.matchAll(/\S+/g)) {
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        const rect = range.getClientRects()[0];
        if (rect) ctx.fillText(word[0], rect.left - box.left, rect.top - box.top + ascent);
      }
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
    onReady();
  };

  return {
    /** Paints the texture now and on every relayout. Fonts must be in first. */
    start: () => {
      paint();
      new ResizeObserver(paint).observe(story);
    },
    draw: ({ time, front, haze, band, floor, focus, lift, settle }: StoryFrame) => {
      place();
      const view = layer.fit();
      const box = story.getBoundingClientRect();
      // Story origin snapped to the canvas's device pixels (crisp texels), kept in screen space.
      const left = view.left + snap(box.left - view.left);
      const top = view.top + snap(box.top - view.top);
      gl.uniform2f(u.origin, left, top);
      gl.uniform2f(u.size, size.width, size.height);
      gl.uniform2f(u.band, band.top, band.height);
      gl.uniform1f(u.floor, floor);
      gl.uniform1f(u.focus, focus);
      gl.uniform1f(u.lift, lift);
      gl.uniform1f(u.settle, settle);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.front, front);
      gl.uniform1f(u.haze, haze);
      layer.draw();
    },
  };
}
