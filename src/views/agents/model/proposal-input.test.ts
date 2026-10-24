import { expect, test } from "vitest";
import {
  ideaFilterSchema,
  proposalInputSchema,
  proposalState,
  proposalUpdateSchema,
  withdrawInputSchema,
} from "./proposal-input";

const valid = {
  goal: "Grow course sign-ups",
  idea: "Carousel: 5 phishing signs",
  platforms: ["instagram"],
  type: "carousel",
  publishDate: "2026-10-30",
  goldenTime: "20:00",
  why: "Phishing posts got 2x saves last month.",
};

test("accepts a full proposal and defaults asset links and sources", () => {
  expect(proposalInputSchema.parse(valid)).toMatchObject({
    ...valid,
    assetLinks: [],
    sources: [],
  });
});

test("keeps what the idea is based on, up to 10 sources", () => {
  const sources = [
    "https://github.com/org/repo/pull/12",
    "Roadmap sync 20 Oct",
  ];
  expect(proposalInputSchema.parse({ ...valid, sources }).sources).toEqual(
    sources,
  );
  expect(
    proposalInputSchema.safeParse({
      ...valid,
      sources: Array.from({ length: 11 }, (_, i) => `s${i}`),
    }).success,
  ).toBe(false);
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

test("reads pending, approved, rejected and withdrawn", () => {
  const open = { rejectedAt: null, withdrawnAt: null };
  expect(proposalState({ status: "proposed", ...open })).toBe("pending");
  expect(proposalState({ status: "planned", ...open })).toBe("approved");
  expect(
    proposalState({ status: "proposed", ...open, rejectedAt: new Date() }),
  ).toBe("rejected");
  expect(
    proposalState({ status: "proposed", ...open, withdrawnAt: new Date() }),
  ).toBe("withdrawn");
});

test("an update needs at least one field, and only fields agents may set", () => {
  expect(proposalUpdateSchema.safeParse({}).success).toBe(false);
  expect(proposalUpdateSchema.parse({ idea: " Shorter idea " })).toEqual({
    idea: "Shorter idea",
  });
  expect(proposalUpdateSchema.safeParse({ status: "planned" }).success).toBe(
    false,
  );
});

test("an update can clear the day and time with null", () => {
  expect(
    proposalUpdateSchema.parse({ publishDate: null, goldenTime: null }),
  ).toEqual({ publishDate: null, goldenTime: null });
});

test("a withdrawal may give a reason", () => {
  expect(withdrawInputSchema.parse({})).toEqual({});
  expect(
    withdrawInputSchema.parse({ reason: "Merged into another idea" }),
  ).toEqual({ reason: "Merged into another idea" });
});

test("lists 50 ideas by default and at most 100", () => {
  expect(ideaFilterSchema.parse({}).limit).toBe(50);
  expect(ideaFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  expect(ideaFilterSchema.safeParse({ state: "archived" }).success).toBe(false);
});

test("takes a Markdown brief of up to 3,000 characters", () => {
  const goal = `**Goal:** grow sign-ups\n\n- one\n- two\n\n${"x".repeat(2960)}`;
  expect(proposalInputSchema.parse({ ...valid, goal }).goal).toBe(goal);
  expect(
    proposalInputSchema.safeParse({ ...valid, goal: "x".repeat(3001) }).success,
  ).toBe(false);
});
