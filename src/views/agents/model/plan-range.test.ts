import { expect, test } from "vitest";
import { planRangeSchema } from "./plan-range";

// 23 Oct 2026, 20:00 UTC is already 24 Oct in Vietnam.
const schema = planRangeSchema(
  new Date("2026-10-23T20:00:00Z"),
  "Asia/Ho_Chi_Minh",
);

test("defaults to today and the next 30 days in the team's zone", () => {
  expect(schema.parse({})).toEqual({ from: "2026-10-24", to: "2026-11-23" });
});

test("keeps a valid range", () => {
  expect(schema.parse({ from: "2026-11-01", to: "2026-11-30" })).toEqual({
    from: "2026-11-01",
    to: "2026-11-30",
  });
});

test("rejects a backwards or too long range", () => {
  expect(
    schema.safeParse({ from: "2026-11-30", to: "2026-11-01" }).success,
  ).toBe(false);
  expect(
    schema.safeParse({ from: "2026-01-01", to: "2026-12-31" }).success,
  ).toBe(false);
  expect(schema.safeParse({ from: "tomorrow" }).success).toBe(false);
});
