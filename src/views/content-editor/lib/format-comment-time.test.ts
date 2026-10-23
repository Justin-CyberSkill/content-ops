import { expect, test } from "vitest";
import { formatCommentTime } from "./format-comment-time";

const now = new Date("2026-10-23T09:00:00Z");
const zone = "Asia/Ho_Chi_Minh";

test("shows day, month and time in the team's zone", () => {
  const at = new Date("2026-10-23T09:20:00Z");
  expect(formatCommentTime(at, "en", zone, now)).toBe("23 Oct, 16:20");
  expect(formatCommentTime(at, "vi", zone, now)).toBe("16:20 23 thg 10");
});

test("adds the year for an older comment", () => {
  const at = new Date("2025-06-01T20:00:00Z");
  expect(formatCommentTime(at, "en", zone, now)).toBe("2 Jun 2025, 03:00");
});
