import type { ContentStatus } from "@/shared/db/schema";

export type CalendarItem = {
  id: string;
  idea: string;
  publishDate: string;
  /** "19:30:00", or null for an all-day item. */
  goldenTime: string | null;
  status: ContentStatus;
  assigneeId: string | null;
  assigneeName: string | null;
};

export type Schedule = { publishDate: string; goldenTime: string | null };

/**
 * Publish day and golden time are the team's wall-clock time, with no zone.
 * The calendar runs in UTC so "19:30" stays "19:30" in every browser.
 */
export const CALENDAR_TIME_ZONE = "UTC";

/** "2026-10-27" for an all-day item, "2026-10-27T19:30:00" when it has a golden time. */
export function eventStart({ publishDate, goldenTime }: Schedule): string {
  return goldenTime ? `${publishDate}T${goldenTime.slice(0, 8)}` : publishDate;
}

/** Back from where an item was dropped: an all-day slot clears the golden time. */
export function scheduleFromDrop(start: Date, allDay: boolean): Schedule {
  const iso = start.toISOString();
  return {
    publishDate: iso.slice(0, 10),
    goldenTime: allDay ? null : iso.slice(11, 16),
  };
}

export function visibleItems(
  items: CalendarItem[],
  { mineOnly, meId }: { mineOnly: boolean; meId: string },
): CalendarItem[] {
  return mineOnly ? items.filter((item) => item.assigneeId === meId) : items;
}
