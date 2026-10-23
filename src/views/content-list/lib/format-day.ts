import { DATE_LOCALES, type Locale } from "@/shared/i18n";

/**
 * "Tue 27 Oct" (en) / "Th 3, 27 thg 10" (vi) from a date column ("2026-10-27").
 * Adds the year only when it isn't the current one, since the plan is grouped by week.
 */
export function formatDay(
  publishDate: string,
  today: string,
  locale: Locale,
): string {
  const sameYear = publishDate.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(`${publishDate}T00:00:00Z`));
}

/** "drive.google.com/drive/folders/abc" — enough to tell two links on one site apart. */
export function shortLink(link: string): string {
  const url = new URL(link);
  const path = url.pathname.replace(/\/$/, "");
  return `${url.hostname.replace(/^www\./, "")}${path}`;
}
