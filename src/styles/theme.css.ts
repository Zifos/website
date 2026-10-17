import { createGlobalTheme } from "@vanilla-extract/css";

// Source of truth: brand/06-color.md and brand/05-tipografia.md — keep in sync.
// Each color is light-dark(light, dark); the active scheme follows `color-scheme` on :root.
export const vars = createGlobalTheme(":root", {
  color: {
    background: "light-dark(#F5F1EA, #0F0F10)",
    surface: "light-dark(#EAE4DB, #1A1A1C)",
    text: "light-dark(#171717, #F3EEE6)",
    textSecondary: "light-dark(#8C857C, #A8A096)",
    border: "light-dark(#CFC8BE, #2B2B2F)",
    fire: "light-dark(#B53A2F, #C64638)",
    bronze: "light-dark(#A67C45, #B58A52)",
    ash: "light-dark(#D8C1B8, #B89A94)",
  },
  // Font stacks (family + metric-matched fallbacks) come from the `fonts` config in astro.config.ts,
  // loaded in BaseLayout via <Font />.
  font: {
    serif: "var(--font-instrument-serif)",
    sans: "var(--font-dm-sans)",
    mono: "var(--font-ibm-plex-mono)",
  },
  space: {
    md: "1rem",
    lg: "2rem",
  },
});
