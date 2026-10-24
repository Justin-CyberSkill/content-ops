import { DATE_LOCALES, type Locale } from "@/shared/i18n";

/** Today in a time zone, as a date column reads ("2026-10-24"). */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/**
 * "Thu 30 Oct" (en) / "Th 5, 30 thg 10" (vi) from a date column. Adds the year only
 * when it isn't this year, since due days are rarely far off.
 */
export function formatDueDay(
  dueDate: string,
  today: string,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: dueDate.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dueDate}T00:00:00Z`));
}
