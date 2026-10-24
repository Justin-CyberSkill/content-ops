import type { Locale } from "@/shared/i18n";

/** Today in a time zone, as a date column reads ("2026-10-24"). */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

// Spelled out rather than left to Intl: due days render in client components, and the
// server's and the browser's locale data disagree on Vietnamese weekdays ("Th 3" or "Thứ 3").
const WEEKDAYS: Record<Locale, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  vi: ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"],
};
const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * "Thu 30 Oct" (en) / "Th 5, 30 thg 10" (vi) from a date column. Adds the year only
 * when it isn't this year, since due days are rarely far off.
 */
export function formatDueDay(
  dueDate: string,
  today: string,
  locale: Locale,
): string {
  const date = new Date(`${dueDate}T00:00:00Z`);
  const weekday = WEEKDAYS[locale][date.getUTCDay()];
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year =
    dueDate.slice(0, 4) === today.slice(0, 4) ? null : date.getUTCFullYear();
  if (locale === "vi")
    return `${weekday}, ${day} thg ${month + 1}${year ? `, ${year}` : ""}`;
  return `${weekday} ${day} ${EN_MONTHS[month]}${year ? ` ${year}` : ""}`;
}
