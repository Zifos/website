// Derives the logo variants and favicon from the full-canvas source SVG.
// Usage: pnpm brand:logo
// Expects a potrace-style source: 2508×627 canvas, one <g> transform, symbol left of x=1023.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "brand/assets/logo/source/zifos-logo-original.svg";
const OUT = "brand/assets/logo";
const FAVICON = "public/favicon.svg";

// Bounds in source pixels, measured from the original artwork.
const GAP_X = 1023; // gap between "}" and "z"
const BOUNDS = {
  logo: [350, 53, 2133, 586],
  symbol: [350, 53, 986, 544],
  wordmark: [1061, 84, 2133, 586],
};
const PAD = 4;
const GROUP = 'transform="translate(0 627) scale(.1 -.1)"';

const svg = readFileSync(SRC, "utf8");
const paths = [...svg.matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) =>
  m[1].replace(/\s+/g, " ").trim(),
);
const startX = (d) => Number(d.match(/^M(-?\d+)/)[1]) / 10;
const symbol = paths.filter((d) => startX(d) < GAP_X);
const wordmark = paths.filter((d) => startX(d) >= GAP_X);

const g = (ds) => `<g ${GROUP}>${ds.map((d) => `<path d="${d}"/>`).join("")}</g>`;
const variant = (ds, [x0, y0, x1, y1]) => {
  const vb = [x0 - PAD, y0 - PAD, x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD].join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Zifos" fill="currentColor">${g(ds)}</svg>\n`;
};

writeFileSync(`${OUT}/zifos-logo.svg`, variant(paths, BOUNDS.logo));
writeFileSync(`${OUT}/zifos-isotipo.svg`, variant(symbol, BOUNDS.symbol));
writeFileSync(`${OUT}/zifos-wordmark.svg`, variant(wordmark, BOUNDS.wordmark));

// Favicon: square symbol; colors from brand/06-color.md (text, light/dark).
const [x0, y0, x1, y1] = BOUNDS.symbol;
const side = x1 - x0 + 80;
const cx = (x0 + x1) / 2;
const cy = (y0 + y1) / 2;
writeFileSync(
  FAVICON,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx - side / 2} ${cy - side / 2} ${side} ${side}" role="img" aria-label="Zifos"><style>g{fill:#171717}@media (prefers-color-scheme:dark){g{fill:#F3EEE6}}</style>${g(symbol)}</svg>\n`,
);

console.log(`logo: ${paths.length} paths (symbol ${symbol.length}, wordmark ${wordmark.length})`);
