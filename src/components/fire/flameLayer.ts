// The flame layer: what a fire just below the screen would throw up. A flickering warm glow from
// the bottom edge, the smoke column that rises once it catches (and a faint smoke that stays), and
// sparks drifting up and burning out. All soft, so it renders at 1×, fixed to the screen.

import { createLayer, glsl, HAZE, NOISE, resolveColor, SMOKE_FRONT, VIEW } from "./gl";
import { IGNITION } from "./ignition";

const SPARKS = 16; // slots; each relaunches when its spark burns out
const VOLLEY = 7; // the crackle: sparks thrown up at once when the fire catches
/**
 * The swell: once it burns hard, embers carried up by the updraft (not thrown), lifting off over
 * a couple of seconds and burning out before mid-screen.
 */
const SWELL = {
  count: 18,
  spread: 2.5, // s over which they lift off
  speed: [50, 90], // px/s at lift-off
  updraft: 12, // px/s², the hot air speeding them up
  life: [2, 3], // s
} as const;
/**
 * The scouts: sparks the ignition flicks up from the fire below the screen. A small burst of three
 * with the first, failed try; two more, on very different paths, with the ignition that takes.
 * No hot air yet: each is shot out fast, the air's drag eats its speed and gravity bends it over
 * into a falling arc, while it burns its mass away. In 3D, seen in perspective, and out of focus (the focus is on
 * the scene's center): irregular burning embers, softer the further from the focal plane.
 */
interface Scout {
  delay: number; // s after the first try
  x: number; // launch point, of the width…
  below: number; // …and px below the screen's bottom (the fire is out of sight)
  v: [number, number, number]; // x in widths/s; y up and z toward the viewer in px/s
  drag: number; // 1/s
  life: number; // s
  heat: number; // 0 deep red – 1 white-hot
}
const TAKES = IGNITION.take - IGNITION.try; // s from the failed try to the ignition that takes
const SCOUTS: Scout[] = [
  // The try: up and over to the left, with two smaller ones just behind…
  { delay: 0, x: 0.42, below: 40, v: [-0.22, 1250, 150], drag: 2.2, life: 1.5, heat: 0.9 },
  { delay: 0.06, x: 0.6, below: 70, v: [0.25, 900, -200], drag: 2.6, life: 1.1, heat: 0.65 }, // …right, away
  { delay: 0.14, x: 0.36, below: 50, v: [-0.4, 800, 250], drag: 2.4, life: 1.0, heat: 0.35 }, // …low left
  // It takes: one steep and fast, coming at the viewer on the right…
  {
    delay: TAKES - 0.05,
    x: 0.68,
    below: 120,
    v: [0.12, 1700, 650],
    drag: 2.6,
    life: 1.4,
    heat: 0.55,
  },
  // …one in a long, low arc away to the left.
  { delay: TAKES + 0.03, x: 0.4, below: 60, v: [-0.7, 950, -500], drag: 1.7, life: 1.9, heat: 0.2 },
];
const SCOUT_GRAVITY = 900; // px/s²
const FOCAL = 900; // px: the perspective's focal length
const OUT_OF_FOCUS = 1.5; // px of softness even on the focal plane: the scouts are never in focus
const DEFOCUS = 0.012; // more blur per px off the focal plane (z = 0)
const STREAK = 0.004; // trail length per px/s of speed
const GLOW_HEIGHT = 0.12; // of the screen: how far up the light reaches (e-folding)
const GLOW_ALPHA = 0.18;
/** The glow's orange (fire mixed toward bronze, lifted) and how much of it shows. */
const ORANGE = {
  bronze: 0.4,
  lift: 1.15,
  patches: 0.45, // at most, where the drifting gradient runs warm
  flash: 0.85, // across the whole glow at a flash's peak
};
const SMOKE_ALPHA = 0.32;
const SMOKE_SHADE = 0.75; // the ash color's brightness in the smoke
/** Soot: part of the smoke is near black, and denser. */
const SOOT = {
  share: 0.6, // at most, where the churn turns it to soot
  shade: 0.08, // its color, of the lit smoke's
  density: 1.8, // its opacity, of the lit smoke's
};
const COLUMN = 0.6; // the rising column's density, of the resting smoke's: quiet, not a grey wall

const FRAGMENT = `${VIEW}
uniform float uGlow;      // 0–1
uniform float uFlash;     // 0–1, an ignition's flash: the glow runs hot orange
uniform float uSmoke;     // 0–1, the rising column
uniform float uAmbient;   // 0–1, the faint smoke the fire keeps giving off once it has caught
uniform float uSparks;    // 0–1
uniform float uSparkTime; // s since the sparks started
uniform float uBurst;     // s since the fire caught (< 0: not yet)
uniform float uSwell;     // s since the embers started lifting (< 0: not yet)
uniform float uScout;     // s since the scout sparks were shot (< 0: not yet)
uniform float uFlicker;   // 0–1, the fire's breathing
uniform vec3 uFire;
uniform vec3 uBronze;
uniform vec3 uAsh;
${NOISE}
${HAZE}
${SMOKE_FRONT}

float hash(float n) { return fract(sin(n) * 43758.5453); }

// A scout (see SCOUTS): drag and gravity in closed form, projected from the screen's lower middle.
vec4 scout(vec2 p, float since, vec2 from, vec3 v, float drag, float life, float heat, float seed, vec2 view) {
  if (since < 0.0 || since > life) return vec4(0.0);
  float slow = exp(-drag * since);
  float travel = (1.0 - slow) / drag;
  float sink = ${glsl(SCOUT_GRAVITY)} / drag;
  vec3 pos = vec3(
    from.x * view.x + v.x * view.x * travel,
    uFloor + from.y - ((v.y + sink) * travel - sink * since),
    v.z * travel
  );
  vec2 center = vec2(view.x * 0.5, uFloor * 0.62);
  float scale = ${glsl(FOCAL)} / (${glsl(FOCAL)} - pos.z);
  vec2 d = p - (center + (pos.xy - center) * scale);

  // In its own frame: along its flight (+ ahead) and across. Behind it, distances shrink, so the
  // ember trails a short streak, longer the faster it flies.
  vec2 vel = vec2(v.x * view.x * slow, (v.y + sink) * slow - sink) * scale * vec2(1.0, -1.0);
  float speed = length(vel);
  vec2 dir = speed > 1.0 ? vel / speed : vec2(0.0, -1.0);
  vec2 local = vec2(dot(d, dir), dot(d, vec2(-dir.y, dir.x)));
  if (local.x < 0.0) local.x /= 1.0 + min(speed * ${glsl(STREAK)}, 3.0);
  float r = length(local);

  float mass = 1.0 - since / life; // burning away
  float core = 1.4 * sqrt(mass) * scale;
  float radius = core * 1.6 + ${glsl(OUT_OF_FOCUS)} + ${glsl(DEFOCUS)} * abs(pos.z) * scale;
  // A burning, irregular body: its outline flickers, reshaped by noise around it many times a
  // second, around a hot core that flickers faster still.
  float wobble = snoise(local / max(r, 0.001) * 1.7 + vec2(seed * 3.1, uTime * 9.0 + seed));
  float edge = radius * (0.7 + 0.4 * wobble);
  float body = 1.0 - smoothstep(edge * 0.4, edge, r);
  float flicker = 0.7 + 0.3 * sin(uTime * 41.0 + seed * 7.0);
  float spark = exp(-r * r / (core * core)) * flicker;
  float light = (body * 0.55 + spark) * clamp(2.4 * core / radius, 0.3, 1.0) * mass;
  light *= smoothstep(0.0, 0.04, since);
  // From its heat (deep fire red to white-hot bronze), cooling toward red as it burns out.
  vec3 hot = mix(uFire, mix(uBronze, vec3(1.0), 0.45), heat);
  return vec4(mix(uFire, hot, mass), 1.0) * min(light, 1.0);
}

// The swell (see SWELL): embers lifting off one after another, floating up and swaying.
vec4 swell(vec2 p, float since, float width, vec3 hot) {
  vec4 sum = vec4(0.0);
  if (since < 0.0 || since > ${glsl(SWELL.spread + SWELL.life[1])}) return sum;
  for (int i = 0; i < ${SWELL.count}; i++) {
    float seed = float(i) * 7.31 + 211.0;
    float age = since - hash(seed) * ${glsl(SWELL.spread)};
    float life = ${glsl(SWELL.life[0])} + hash(seed + 1.0) * ${glsl(SWELL.life[1] - SWELL.life[0])};
    if (age < 0.0 || age > life) continue;
    float speed = ${glsl(SWELL.speed[0])} + hash(seed + 2.0) * ${glsl(SWELL.speed[1] - SWELL.speed[0])};
    float rise = speed * age + 0.5 * ${glsl(SWELL.updraft)} * age * age;
    float dy = p.y - (uFloor + 4.0 - rise);
    if (abs(dy) > 6.0) continue;
    float x = hash(seed + 3.0) * width
      + sin(age * (1.2 + hash(seed + 4.0)) + seed) * (8.0 + 16.0 * hash(seed + 5.0));
    vec2 d = vec2(p.x - x, dy);
    float radius = 0.7 + 1.0 * hash(seed + 6.0);
    float t = age / life;
    float glow = smoothstep(0.0, 0.1, t) * pow(1.0 - t, 1.3);
    float twinkle = 0.7 + 0.3 * sin(uTime * (7.0 + 6.0 * hash(seed + 7.0)) + seed);
    sum += vec4(mix(hot, uAsh, t), 1.0) * exp(-dot(d, d) / (radius * radius)) * glow * twinkle;
  }
  return sum;
}

// The crackle (see VOLLEY): sparks thrown up together as it catches (since: s since, < 0: not
// yet). They shoot out at 350–700 px/s, slow down in the air and burn out.
vec4 volley(vec2 p, float since, float width, vec3 hot) {
  vec4 sum = vec4(0.0);
  if (since < 0.0 || since > 2.6) return sum;
  for (int i = 0; i < ${VOLLEY}; i++) {
    float seed = float(i) * 5.17 + 101.0;
    float age = since - hash(seed + 6.0) * 0.25; // not quite together
    if (age < 0.0) continue;
    float rise = 350.0 * (1.0 + hash(seed + 1.0)) * 0.9 * (1.0 - exp(-age / 0.9));
    float dy = p.y - (uFloor + 6.0 - rise);
    if (abs(dy) > 7.0) continue;
    float x = (0.15 + 0.7 * hash(seed)) * width + sin(age * 2.0 + seed) * 12.0
      + (hash(seed + 2.0) - 0.5) * 60.0 * age;
    vec2 d = vec2(p.x - x, dy);
    float radius = 0.9 + 1.2 * hash(seed + 5.0);
    float life = 1.0 - smoothstep(0.0, 1.6 + hash(seed + 3.0) * 0.9, age);
    float s = exp(-dot(d, d) / (radius * radius)) * life;
    sum += vec4(mix(hot, uAsh, 1.0 - life), 1.0) * s;
  }
  return sum;
}

void main() {
  vec2 view = uRes / uRatio;
  vec2 p = haze(screen()); // the fire's own light and smoke waver in the hot air too
  float height = uFloor;
  // Below the visible bottom (toolbar, overscroll bounce) the fire keeps its edge brightness.
  float fromBottom = max(uFloor - p.y, 0.0);

  // Glow: light from below, swaying along the edge and breathing with the fire.
  float light = exp(-fromBottom / (height * ${glsl(GLOW_HEIGHT)}));
  vec4 color = vec4(0.0);
  if (light > 0.004) {
    float sway = 0.75 + 0.25 * snoise(vec2(p.x * 0.0025, uTime * 0.35));
    // Red with patches running orange: a soft gradient along the edge, slowly drifting and
    // morphing sideways. A flash turns the whole glow toward that same orange.
    vec3 orange = min(mix(uFire, uBronze, ${glsl(ORANGE.bronze)}) * ${glsl(ORANGE.lift)}, 1.0);
    float warm = 0.5 + 0.5 * snoise(vec2(p.x * 0.0035 + uTime * 0.06, uTime * 0.04));
    warm *= ${glsl(ORANGE.patches)};
    vec3 hot = mix(uFire, orange, warm + (1.0 - warm) * uFlash * ${glsl(ORANGE.flash)});
    color = vec4(hot, 1.0) * light * sway * (0.8 + 0.3 * uFlicker) * uGlow * ${glsl(GLOW_ALPHA)};
  }

  // Smoke: thickest at the rising front and thinning behind it, plus a faint layer the fire keeps
  // giving off. Domain-warped noise gives the wisps; the warp itself drifts over time, so the
  // shapes curl and re-form as they rise instead of sliding by as a fixed texture. The noise
  // only runs where there is smoke to shape.
  float column = 0.0;
  if (uSmoke > 0.0) {
    float behind = smokeBehind(p);
    column = smoothstep(-40.0, 60.0, behind) * exp(-max(behind, 0.0) / (height * 0.45))
      * uSmoke * ${glsl(COLUMN)};
  }
  float amount = column + exp(-fromBottom / (height * 0.14)) * 0.3 * uAmbient;
  if (amount > 0.01) {
    vec2 q = vec2(p.x * 0.004, p.y * 0.003 + uLift * 0.22);
    vec2 warp = vec2(
      fbm(q * 1.6 + vec2(3.1, -uTime * 0.31)),
      fbm(q * 1.6 + vec2(-5.7 + uTime * 0.23, 1.3))
    );
    float wisps = smoothstep(-0.15, 0.7, fbm(q + 0.9 * warp + vec2(0.0, -uTime * 0.07)));
    // Lit wisps and soot: the shapes' own warp splits them, so they swap as the smoke churns.
    // Soot is near black and denser: invisible on the dark page, it shows by covering light
    // (the glow, lit smoke, text).
    float soot = smoothstep(-0.1, 0.35, warp.x - warp.y) * ${glsl(SOOT.share)};
    float smoke = amount * wisps * ${glsl(SMOKE_ALPHA)} * (1.0 + soot * ${glsl(SOOT.density - 1)});
    // Dim ash, lit warm by the fire just above the edge: quiet against the dark, like the rest.
    vec3 lit = mix(uAsh * ${glsl(SMOKE_SHADE)}, uFire, exp(-fromBottom / (height * 0.07)) * 0.4);
    vec3 tint = mix(lit, lit * ${glsl(SOOT.shade)}, soot);
    color = vec4(tint, 1.0) * smoke + color * (1.0 - smoke);
  }

  // Sparks: born just below the edge, rising and swaying, cooling from hot bronze to ash. Each
  // is checked against this pixel's row first, so most pixels skip the rest of the math.
  vec4 sparks = vec4(0.0);
  vec3 hot = mix(uBronze, vec3(1.0), 0.35);
  if (uSparks > 0.0) {
    for (int i = 0; i < ${SPARKS}; i++) {
      float fi = float(i);
      float period = 4.0 + hash(fi * 1.31) * 3.0;
      float t = uSparkTime + hash(fi * 7.17) * period; // staggered launches
      float age = fract(t / period);
      if (uSparkTime - age * period < 0.0) continue; // launched before the fire was lit
      float seed = fi * 13.73 + floor(t / period) * 7.91;
      float rise = age * period * (60.0 + hash(seed + 1.0) * 80.0);
      float dy = p.y - (uFloor + 6.0 - rise);
      if (abs(dy) > 6.0) continue;
      float x = hash(seed) * view.x
        + sin(rise * 0.02 + seed) * (6.0 + 14.0 * hash(seed + 2.0))
        + sin(rise * 0.0071 + seed * 3.1) * 24.0;
      vec2 d = vec2(p.x - x, dy);
      float radius = 0.7 + 1.1 * hash(seed + 5.0);
      float life = smoothstep(0.0, 0.08, age) * pow(1.0 - age, 1.5);
      float twinkle = 0.65 + 0.35 * sin(uTime * (9.0 + 9.0 * hash(seed + 4.0)) + seed);
      float s = exp(-dot(d, d) / (radius * radius)) * life * twinkle;
      sparks += vec4(mix(hot, uAsh, age), 1.0) * s;
    }
  }
  sparks *= uSparks * (0.8 + 0.4 * uFlicker);

  // The catch: first the scouts flicked away, then, as it catches, sparks thrown up all at once.
${SCOUTS.map(
  ({ delay, x, below, v: [vx, vy, vz], drag, life, heat }, i) =>
    `  sparks += scout(p, uScout - ${glsl(delay)}, vec2(${glsl(x)}, ${glsl(below)}), vec3(${glsl(vx)}, ${glsl(vy)}, ${glsl(vz)}), ${glsl(drag)}, ${glsl(life)}, ${glsl(heat)}, ${glsl(i * 1.37 + 0.5)}, view);`,
).join("\n")}
  sparks += volley(p, uBurst, view.x, hot);
  // Then, once it burns hard, the embers it carries up.
  sparks += swell(p, uSwell, view.x, hot);
  color += min(sparks, 1.0) * (1.0 - color.a);

  // Dither the soft gradients (premultiplied: keep color within alpha).
  color.rgb = clamp(color.rgb + dither(), 0.0, color.a);
  gl_FragColor = color;
}
`;

interface FlameFrame {
  time: number;
  haze: number;
  band: { top: number; height: number };
  floor: number;
  front: number;
  glow: number;
  flash: number;
  smoke: number;
  ambient: number;
  sparks: number;
  sparkTime: number;
  burst: number;
  swell: number;
  scout: number;
  lift: number;
  flicker: number;
}

interface Options {
  canvas: HTMLCanvasElement;
  /** Color tokens. */
  colors: { fire: string; bronze: string; ash: string };
}

export function createFlameLayer({ canvas, colors }: Options) {
  const layer = createLayer(canvas, FRAGMENT, 1);
  if (!layer) return null;
  const { gl, uniform } = layer;
  gl.uniform3f(uniform("uFire"), ...resolveColor(colors.fire, canvas));
  gl.uniform3f(uniform("uBronze"), ...resolveColor(colors.bronze, canvas));
  gl.uniform3f(uniform("uAsh"), ...resolveColor(colors.ash, canvas));
  const uBand = uniform("uBand");
  const names = [
    "time",
    "haze",
    "floor",
    "front",
    "glow",
    "flash",
    "smoke",
    "ambient",
    "sparks",
    "sparkTime",
    "burst",
    "swell",
    "scout",
    "lift",
    "flicker",
  ] as const;
  const u = Object.fromEntries(
    names.map((name) => [name, uniform(`u${name[0]?.toUpperCase()}${name.slice(1)}`)]),
  ) as Record<(typeof names)[number], WebGLUniformLocation | null>;

  return {
    draw: (frame: FlameFrame) => {
      layer.fit();
      gl.uniform2f(uBand, frame.band.top, frame.band.height);
      for (const name of names) gl.uniform1f(u[name], frame[name]);
      layer.draw();
    },
  };
}
