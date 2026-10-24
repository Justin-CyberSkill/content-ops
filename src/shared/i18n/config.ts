import type messages from "./messages/en.json";

export type Messages = typeof messages;

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Each language named in itself, for the switch. */
export const LOCALE_NAMES: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export const DEFAULT_LOCALE: Locale = "vi";

/** Holds the language picked in the sidebar. No locale in the URL. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Intl locale for dates: en-GB keeps day-before-month ("Tue, 27 Oct 2026"). */
export const DATE_LOCALES: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
