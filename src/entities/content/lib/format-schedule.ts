import { DATE_LOCALES, type Locale } from "@/shared/i18n";

/**
 * "Tue, 27 Oct 2026 · 19:30" (en) from a date column ("2026-10-27") and a time column ("19:30:00").
 * Null without a date, so the caller can show its own "No date" text.
 */
export function formatSchedule(
  publishDate: string | null,
  goldenTime: string | null,
  locale: Locale,
): string | null {
  if (!publishDate) return null;
  const day = new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${publishDate}T00:00:00Z`));
  return goldenTime ? `${day} · ${goldenTime.slice(0, 5)}` : day;
}
