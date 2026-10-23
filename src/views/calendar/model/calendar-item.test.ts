import { expect, test } from "vitest";
import {
  type CalendarItem,
  eventStart,
  scheduleFromDrop,
  visibleItems,
} from "./calendar-item";

test("starts all-day items on the day and timed items at the golden time", () => {
  expect(eventStart({ publishDate: "2026-10-27", goldenTime: null })).toBe(
    "2026-10-27",
  );
  expect(
    eventStart({ publishDate: "2026-10-27", goldenTime: "19:30:00" }),
  ).toBe("2026-10-27T19:30:00");
});

test("reads the new day and time from a drop in UTC", () => {
  const start = new Date("2026-10-29T20:00:00Z");
  expect(scheduleFromDrop(start, false)).toEqual({
    publishDate: "2026-10-29",
    goldenTime: "20:00",
  });
  expect(scheduleFromDrop(start, true)).toEqual({
    publishDate: "2026-10-29",
    goldenTime: null,
  });
});

test("keeps only my items when Mine only is on", () => {
  const item = (id: string, assigneeId: string | null): CalendarItem => ({
    id,
    idea: id,
    publishDate: "2026-10-27",
    goldenTime: null,
    status: "planned",
    assigneeId,
    assigneeName: null,
  });
  const items = [item("a", "me"), item("b", "other"), item("c", null)];
  expect(visibleItems(items, { mineOnly: false, meId: "me" })).toHaveLength(3);
  expect(
    visibleItems(items, { mineOnly: true, meId: "me" }).map((i) => i.id),
  ).toEqual(["a"]);
});
