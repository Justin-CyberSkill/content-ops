import { expect, test } from "vitest";
import {
  daysOf,
  groupContent,
  groupOf,
  nextDay,
  todayIn,
} from "./content-groups";

// Friday 23 Oct 2026: this week runs Mon 19 – Sun 25, next week Mon 26 – Sun 1 Nov.
const today = "2026-10-23";
const item = (publishDate: string | null, status = "planned" as const) => ({
  publishDate,
  status,
});

test("puts each item in its section", () => {
  expect(groupOf(item("2026-10-22"), today)).toBe("overdue");
  expect(groupOf(item("2026-10-23"), today)).toBe("thisWeek");
  expect(groupOf(item("2026-10-25"), today)).toBe("thisWeek");
  expect(groupOf(item("2026-10-26"), today)).toBe("nextWeek");
  expect(groupOf(item("2026-11-01"), today)).toBe("nextWeek");
  expect(groupOf(item("2026-11-02"), today)).toBe("later");
  expect(groupOf(item(null), today)).toBe("noDate");
});

test("published items leave the plan whatever their date", () => {
  expect(
    groupOf({ publishDate: "2026-10-20", status: "published" }, today),
  ).toBe("published");
  expect(groupOf({ publishDate: null, status: "published" }, today)).toBe(
    "published",
  );
});

test("on a Monday, this week starts today", () => {
  expect(groupOf(item("2026-10-25"), "2026-10-19")).toBe("thisWeek");
  expect(groupOf(item("2026-10-26"), "2026-10-19")).toBe("nextWeek");
});

test("returns only non-empty sections, in display order", () => {
  const rows = [
    item(null),
    { publishDate: "2026-10-20", status: "published" as const },
    item("2026-10-27"),
    item("2026-10-24"),
  ];
  expect(
    groupContent(rows, today).map(({ group, rows }) => [group, rows.length]),
  ).toEqual([
    ["thisWeek", 1],
    ["nextWeek", 1],
    ["noDate", 1],
    ["published", 1],
  ]);
});

test("reads today in the given time zone", () => {
  // 18:00 UTC on 23 Oct is already 24 Oct in Vietnam (UTC+7).
  const now = new Date("2026-10-23T18:00:00Z");
  expect(todayIn("Asia/Ho_Chi_Minh", now)).toBe("2026-10-24");
  expect(todayIn("UTC", now)).toBe("2026-10-23");
});

test("week sections cover Monday to Sunday, later starts the Monday after", () => {
  // Saturday 24 Oct 2026.
  expect(daysOf("thisWeek", "2026-10-24")).toEqual({
    from: "2026-10-19",
    to: "2026-10-25",
  });
  expect(daysOf("nextWeek", "2026-10-24")).toEqual({
    from: "2026-10-26",
    to: "2026-11-01",
  });
  expect(daysOf("later", "2026-10-24")).toEqual({ from: "2026-11-02" });
  expect(daysOf("overdue", "2026-10-24")).toBeNull();
  expect(nextDay("2026-10-31")).toBe("2026-11-01");
});
