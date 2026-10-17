# Zifos website

Marketing site for ZIFOS, a boutique product & technology consultancy. Astro (static) + Vanilla Extract, pnpm.

## Brand first

`brand/` is the source of truth for identity. Read the relevant file before writing copy or styling anything:

- Copy, headlines, microcopy → `brand/03-voz-y-tono.md` (and `02-personalidad.md`, `09-principios.md`).
- Colors → `brand/06-color.md`. Typography → `brand/05-tipografia.md`. Layout/art direction → `brand/08-composicion.md`.
- Logos → `brand/assets/logo/` (see `brand/04-logotipo.md`). Import as components: `import Logo from "@brand/assets/logo/zifos-logo.svg"`. Never redraw or recolor the logo; it uses `currentColor`.

The guidelines are written in Spanish; keep them in Spanish when editing. When a brand decision changes, update the `brand/` doc, add a `brand/CHANGELOG.md` entry, and sync `src/styles/theme.css.ts` in the same change.

## Styling

- Vanilla Extract only (`*.css.ts`). No inline styles, no plain CSS files, no utility frameworks.
- Fonts: Instrument Serif (headings), DM Sans (body), IBM Plex Mono (code), configured in `astro.config.ts` `fonts` (Google provider, self-hosted at build) and loaded with `<Font />` in BaseLayout. Add weights/styles there; never add a `<link>` to Google Fonts.
- Use tokens from `src/styles/theme.css.ts` (`vars.color.*`, `vars.font.*`, `vars.space.*`). Never hardcode hex values.
- Colors are `light-dark()` pairs; light/dark follows the user's system. Check both modes.
- Accents (`fire`, `bronze`) are ~10% of any composition and never compete with each other.
- `.css.ts` files never go in `src/pages/` — Astro treats every file there as a route. Put them in `src/styles/` or next to the component.

## SEO

Every page uses `src/layouts/BaseLayout.astro` with a unique `title` and `description`. Canonical, Open Graph, sitemap and robots.txt derive from `site` in `astro.config.ts`. URLs use trailing slashes.

## Commands

- `pnpm dev` — dev server (Astro 7 runs it as a daemon: `pnpm astro dev stop` / `status` / `logs`).
- `pnpm build` — type check + build. `pnpm check` — types + Biome lint/format. `pnpm fix` — autofix.
- `pnpm brand:logo` — regenerate logo variants + favicon from `brand/assets/logo/source/zifos-logo-original.svg`.
- Run `pnpm check` before considering work done.

## Dependencies

pnpm only. Versions are exact and lockfile is committed. `pnpm-workspace.yaml` enforces `minimumReleaseAge` (3 days) and an `allowBuilds` allowlist for install scripts — don't bypass either; approve new build scripts explicitly.
