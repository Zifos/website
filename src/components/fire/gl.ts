// Shared WebGL plumbing for the fire layers: one full-screen quad per canvas, plus the GLSL both
// layers need to agree on (noise, the heat haze, and the smoke front that reveals the story).

export const glsl = (n: number) => n.toFixed(4);

export const NOISE = `
// 2D simplex noise (Ashima Arts, MIT).
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p = p * 2.03 + 17.0;
    amp *= 0.5;
  }
  return sum;
}
`;

const FRONT_RAGGEDNESS = 150; // px the front reaches ahead of / falls behind its line

/**
 * The smoke front, in screen CSS px: where the rising smoke has reached. Below it the smoke has
 * passed and the story shows. Ragged and alive, identically in both layers: domain-warped noise
 * rising with the smoke, its warp drifting over time, so the reveal curls and breaks into islands.
 * The raggedness eases out as the front leaves the screen (no pop), and the noise is skipped then.
 */
export const SMOKE_FRONT = `
uniform float uFront;
uniform float uLift; // how far the hot air has carried the smoke's noise up (surges when it catches)
float smokeBehind(vec2 p) {
  float behind = p.y - uFront;
  float ragged = ${glsl(FRONT_RAGGEDNESS)}
    * smoothstep(-450.0, -150.0, uFront)
    * (1.0 - smoothstep(uFloor + 150.0, uFloor + 450.0, uFront));
  if (ragged <= 0.0) return behind;
  vec2 q = vec2(p.x * 0.004, p.y * 0.003 + uLift * 0.25);
  vec2 warp = vec2(
    fbm(q * 1.4 + vec2(1.7, -uTime * 0.35)),
    fbm(q * 1.4 + vec2(-4.2 + uTime * 0.27, 2.9))
  );
  return behind + fbm(q + 0.9 * warp) * ragged;
}
`;

/** Two noise layers, each rising at its own speed: the churn of hot air. Frequencies in 1/px. */
const HAZE_LAYERS = [
  { frequency: { x: 0.005, y: 0.018 }, rise: 34 }, // broad, slow swell
  { frequency: { x: 0.01, y: 0.036 }, rise: 62 }, // finer, faster shimmer
];
const HAZE_AMPLITUDE = 7; // px of displacement at full strength (typical offsets are ~40% of it)
const HAZE_CURVE = 1.7; // strength = t^CURVE across the band: calm at the top, building to the bottom

/**
 * The heat haze: where a screen point actually shows, displaced by the rising air. Applied to
 * everything the fire draws (text, glow, smoke, sparks), so they all waver together.
 */
export const HAZE = `
uniform vec2 uBand;  // haze band top and height, CSS px
uniform float uHaze; // 0–1
vec2 haze(vec2 p) {
  float t = clamp((p.y - uBand.x) / uBand.y, 0.0, 1.0);
  float strength = pow(t, ${glsl(HAZE_CURVE)}) * uHaze;
  if (strength <= 0.0) return p;
  vec2 d = vec2(0.0);
  ${HAZE_LAYERS.map(
    ({ frequency: { x: fx, y: fy }, rise }, i) => `{
    // Noise fixed to the screen, sliding up: features rise at ${rise}px/s.
    vec2 n = vec2(p.x * ${glsl(fx)}, (p.y + uTime * ${glsl(rise)}) * ${glsl(fy)}) + ${glsl(i * 41.3)};
    d += vec2(snoise(n), snoise(n + vec2(17.1, 5.7)));
  }`,
  ).join("\n  ")}
  return p + d * (${glsl(HAZE_AMPLITUDE / HAZE_LAYERS.length)} * strength);
}
`;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/** Every fragment shader gets these (`uRes`, `uRatio` and `uOffset` set by `fit()`). */
export const VIEW = `
precision highp float;
uniform vec2 uRes;    // drawing buffer, device px
uniform float uRatio; // device px per CSS px
uniform vec2 uOffset; // canvas top-left on screen, CSS px
uniform float uTime;  // s
uniform float uFloor; // the visible bottom of the screen, CSS px
// This fragment in screen CSS px, y down: all effects live in screen space.
vec2 screen() { return vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRatio + uOffset; }
// ±0.5/255 of noise: breaks the 8-bit banding of soft gradients.
float dither() { return (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0; }
`;

export interface Layer {
  gl: WebGLRenderingContext;
  ratio: number;
  uniform: (name: string) => WebGLUniformLocation | null;
  /** Matches the drawing buffer to the canvas size; returns the canvas rect on screen. */
  fit: () => DOMRect;
  draw: () => void;
}

export function createLayer(canvas: HTMLCanvasElement, fragment: string, ratio: number) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const frag = compile(gl.FRAGMENT_SHADER, fragment);
  if (!program || !vertex || !frag) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV)
      console.error(gl.getShaderInfoLog(frag), gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  // One triangle pair covering the canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uRes = uniform("uRes");
  const uRatio = uniform("uRatio");
  const uOffset = uniform("uOffset");
  const layer: Layer = {
    gl,
    ratio,
    uniform,
    fit: () => {
      const view = canvas.getBoundingClientRect();
      const width = Math.round(view.width * ratio);
      const height = Math.round(view.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uRatio, ratio);
      gl.uniform2f(uOffset, view.left, view.top);
      return view;
    },
    draw: () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4),
  };
  return layer;
}

/** Resolves a color token (var(), light-dark()) to 0–1 sRGB channels via a throwaway element. */
export function resolveColor(token: string, near: Element): [number, number, number] {
  const probe = document.createElement("i");
  probe.style.color = token;
  near.after(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}
