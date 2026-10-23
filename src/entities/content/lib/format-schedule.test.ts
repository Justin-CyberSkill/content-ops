import { expect, test } from "vitest";
import { formatSchedule } from "./format-schedule";

test("formats the date and golden time", () => {
  expect(formatSchedule("2026-10-27", "19:30:00")).toBe(
    "Tue, 27 Oct 2026 · 19:30",
  );
});

test("formats a date without a time", () => {
  expect(formatSchedule("2026-10-27", null)).toBe("Tue, 27 Oct 2026");
});

test("says when there is no date", () => {
  expect(formatSchedule(null, "19:30:00")).toBe("No date");
});
