const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "Mon, 27 Oct 2026 · 19:30" from a date column ("2026-10-27") and a time column ("19:30:00"). */
export function formatSchedule(
  publishDate: string | null,
  goldenTime: string | null,
): string {
  if (!publishDate) return "No date";
  const day = dateFormat.format(new Date(`${publishDate}T00:00:00Z`));
  return goldenTime ? `${day} · ${goldenTime.slice(0, 5)}` : day;
}
