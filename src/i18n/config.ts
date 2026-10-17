// Locale registry, shared by astro.config.ts (routing, sitemap) and the site. No Astro/Vite imports
// here: the config loads this file before the build environment exists.
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

/** Served at the site root (no /en/ prefix) and used as hreflang x-default. */
export const defaultLocale: Locale = "en";
