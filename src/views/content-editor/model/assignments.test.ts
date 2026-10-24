import { expect, test } from "vitest";
import { parseAssignments, readAssignments } from "./assignments";

const step = "8f6c1c1e-0000-4000-8000-0000000000a1";
const other = "8f6c1c1e-0000-4000-8000-0000000000a2";

test("reads who takes each step from the form, blank as unassigned", () => {
  const formData = new FormData();
  formData.set("goal", "Grow sign-ups");
  formData.set(`assignee:${step}`, "user-ky");
  formData.set(`assignee:${other}`, "");
  expect(parseAssignments(readAssignments(formData))).toEqual(
    new Map([
      [step, "user-ky"],
      [other, null],
    ]),
  );
});

test("drops malformed assignments, so every step falls back to its suggestion", () => {
  expect(parseAssignments({ "not-a-step": "user-ky" })).toEqual(new Map());
  expect(parseAssignments("user-ky")).toEqual(new Map());
});
