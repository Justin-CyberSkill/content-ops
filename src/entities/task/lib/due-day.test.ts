import { expect, test } from "vitest";
import { formatDueDay, todayIn } from "./due-day";

test("formats a due day the same on the server and in the browser", () => {
  expect(formatDueDay("2026-11-10", "2026-10-24", "en")).toBe("Tue 10 Nov");
  expect(formatDueDay("2026-11-10", "2026-10-24", "vi")).toBe(
    "Th 3, 10 thg 11",
  );
});

test("adds the year only when it isn't this year", () => {
  expect(formatDueDay("2027-01-03", "2026-12-30", "en")).toBe("Sun 3 Jan 2027");
  expect(formatDueDay("2027-01-03", "2026-12-30", "vi")).toBe(
    "CN, 3 thg 1, 2027",
  );
});

test("today is the team's day, not the server's", () => {
  expect(todayIn("Asia/Ho_Chi_Minh", new Date("2026-10-24T18:30:00Z"))).toBe(
    "2026-10-25",
  );
});
