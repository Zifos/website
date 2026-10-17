import sitemap from "@astrojs/sitemap";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig, envField, fontProviders } from "astro/config";

export default defineConfig({
  // Canonical origin — used for canonical URLs, Open Graph and the sitemap. Overridable so the same
  // build can target a preview host (e.g. GitHub Pages under /website/), see .github/workflows.
  site: process.env.SITE_URL ?? "https://zifos.dev",
  base: process.env.BASE_PATH ?? "/",
  env: {
    schema: {
      // Preview deployments are kept out of search engines (noindex + robots Disallow).
      PREVIEW: envField.boolean({ context: "server", access: "public", default: false }),
    },
  },
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  // Typefaces per brand/05-tipografia.md. Google Fonts, downloaded at build time and self-hosted
  // (no runtime request to Google), with metric-matched fallbacks.
  fonts: [
    {
      name: "Instrument Serif",
      cssVariable: "--font-instrument-serif",
      provider: fontProviders.google(),
      weights: [400],
      styles: ["normal", "italic"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      provider: fontProviders.google(),
      weights: ["100 1000"],
      styles: ["normal", "italic"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ["normal"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
  integrations: [sitemap()],
  vite: {
    plugins: [vanillaExtractPlugin()],
  },
});
