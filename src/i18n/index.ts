import { defaultLocale, type Locale, locales } from "./config";

export { defaultLocale, type Locale, locales };

export const localeInfo: Record<Locale, { name: string; short: string; og: string }> = {
  en: { name: "English", short: "EN", og: "en_US" },
  es: { name: "Español", short: "ES", og: "es_AR" },
};

/** localStorage key for a language the visitor picked explicitly (see LanguageSwitch). */
export const LOCALE_STORAGE_KEY = "zifos:locale";

export const ui = {
  en: { language: "Language" },
  es: { language: "Idioma" },
} satisfies Record<Locale, Record<string, string>>;

export function toLocale(value: string | undefined): Locale {
  return locales.find((locale) => locale === value) ?? defaultLocale;
}

/** A page's path without base and locale prefix ("/website/es/foo/" → "foo/"), for getRelativeLocaleUrl. */
export function routePath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const rest = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//, "");
  const [first = ""] = rest.split("/");
  return first !== defaultLocale && locales.some((locale) => locale === first)
    ? rest.slice(first.length + 1)
    : rest;
}
