import { expect, test } from "vitest";
import { contentHref, originHref, parseOrigin } from "./content-origin";

test("an item opens under the list it came from", () => {
  expect(contentHref("abc", "plan")).toBe("/content/abc");
  expect(contentHref("abc", "tasks")).toBe("/my-tasks/abc");
  expect(contentHref("abc", "review")).toBe("/review/abc");
});

test("goes back to the list it came from", () => {
  expect(originHref(parseOrigin("tasks"))).toBe("/my-tasks");
  expect(originHref(parseOrigin("review"))).toBe("/review");
});

test("falls back to the plan for a missing or unknown origin", () => {
  expect(parseOrigin(undefined)).toBe("plan");
  expect(parseOrigin("https://example.com")).toBe("plan");
  expect(parseOrigin("toString")).toBe("plan");
  expect(parseOrigin(["tasks"])).toBe("plan");
});
