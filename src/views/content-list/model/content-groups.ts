import type { ContentStatus } from "@/shared/db/schema";

/** Sections of the content plan, top to bottom. */
const CONTENT_GROUPS = [
  "overdue",
  "thisWeek",
  "nextWeek",
  "later",
  "noDate",
  "published",
] as const;

export type ContentGroup = (typeof CONTENT_GROUPS)[number];

type Groupable = { publishDate: string | null; status: ContentStatus };

const DAY_MS = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DAY_MS;

/** "2026-10-23" for the given moment in that time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/**
 * Published items go to their own section whatever their date.
 * Weeks start on Monday; an unpublished item dated before today is overdue.
 */
export function groupOf(item: Groupable, today: string): ContentGroup {
  if (item.status === "published") return "published";
  if (!item.publishDate) return "noDate";
  const day = toDay(item.publishDate);
  const now = toDay(today);
  if (day < now) return "overdue";
  // 1 Jan 1970 was a Thursday, so Monday-based weekday = (days + 3) % 7.
  const weekStart = now - ((now + 3) % 7);
  if (day < weekStart + 7) return "thisWeek";
  if (day < weekStart + 14) return "nextWeek";
  return "later";
}

/** Non-empty sections in display order. Keeps each section's rows in the order given. */
export function groupContent<T extends Groupable>(
  rows: T[],
  today: string,
): { group: ContentGroup; rows: T[] }[] {
  const byGroup = new Map<ContentGroup, T[]>();
  for (const row of rows) {
    const group = groupOf(row, today);
    byGroup.set(group, [...(byGroup.get(group) ?? []), row]);
  }
  return CONTENT_GROUPS.flatMap((group) => {
    const items = byGroup.get(group);
    return items ? [{ group, rows: items }] : [];
  });
}
