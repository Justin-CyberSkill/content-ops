import { DATE_LOCALES, type Locale } from "@/shared/i18n";

/** "23 Oct, 16:20" (en) / "16:20 23 thg 10" (vi) in the given zone; adds the year when it isn't this one. */
export function formatCommentTime(
  at: Date,
  locale: Locale,
  timeZone: string,
  now = new Date(),
): string {
  const year = (date: Date) =>
    new Intl.DateTimeFormat("en", { timeZone, year: "numeric" }).format(date);
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: "numeric",
    month: "short",
    year: year(at) === year(now) ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(at);
}
