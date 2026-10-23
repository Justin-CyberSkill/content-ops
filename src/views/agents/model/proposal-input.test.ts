import { expect, test } from "vitest";
import { proposalInputSchema, proposalState } from "./proposal-input";

const valid = {
  goal: "Grow course sign-ups",
  idea: "Carousel: 5 phishing signs",
  platforms: ["instagram"],
  type: "carousel",
  publishDate: "2026-10-30",
  goldenTime: "20:00",
  why: "Phishing posts got 2x saves last month.",
};

test("accepts a full proposal and defaults asset links", () => {
  expect(proposalInputSchema.parse(valid)).toMatchObject({
    ...valid,
    assetLinks: [],
  });
});

test("needs a why and at least one platform", () => {
  expect(proposalInputSchema.safeParse({ ...valid, why: " " }).success).toBe(
    false,
  );
  expect(
    proposalInputSchema.safeParse({ ...valid, platforms: [] }).success,
  ).toBe(false);
});

test("rejects fields agents may not set", () => {
  expect(
    proposalInputSchema.safeParse({ ...valid, status: "published" }).success,
  ).toBe(false);
  expect(
    proposalInputSchema.safeParse({ ...valid, assigneeId: "u1" }).success,
  ).toBe(false);
});

test("rejects a golden time that isn't HH:MM", () => {
  expect(
    proposalInputSchema.safeParse({ ...valid, goldenTime: "8pm" }).success,
  ).toBe(false);
});

test("reads pending, approved and rejected", () => {
  expect(proposalState({ status: "proposed", rejectedAt: null })).toBe(
    "pending",
  );
  expect(proposalState({ status: "planned", rejectedAt: null })).toBe(
    "approved",
  );
  expect(proposalState({ status: "proposed", rejectedAt: new Date() })).toBe(
    "rejected",
  );
});
