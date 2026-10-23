import { expect, test } from "vitest";
import { formatSchedule } from "./format-schedule";

test("formats the date and golden time", () => {
  expect(formatSchedule("2026-10-27", "19:30:00", "en")).toBe(
    "Tue, 27 Oct 2026 · 19:30",
  );
});

test("formats a date without a time", () => {
  expect(formatSchedule("2026-10-27", null, "en")).toBe("Tue, 27 Oct 2026");
});

test("formats the date in Vietnamese", () => {
  expect(formatSchedule("2026-10-27", "19:30:00", "vi")).toMatch(
    /27.*2026 · 19:30$/,
  );
});

test("returns null when there is no date", () => {
  expect(formatSchedule(null, "19:30:00", "en")).toBeNull();
});
