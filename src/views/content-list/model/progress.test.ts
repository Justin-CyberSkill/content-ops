import { expect, test } from "vitest";
import { progressOf } from "./progress";

const task = (name: string, status: "waiting" | "todo" | "done") => ({
  name,
  status,
  dueDate: "2026-10-25",
});

test("the first task not done is the one in hand", () => {
  expect(
    progressOf([
      task("Content prep", "done"),
      task("Asset prep", "todo"),
      task("Review", "waiting"),
    ]),
  ).toEqual({
    step: 2,
    total: 3,
    open: { name: "Asset prep", dueDate: "2026-10-25" },
  });
});

test("nothing in hand once every task is done, and no progress without tasks", () => {
  expect(progressOf([task("Publishing", "done")])).toEqual({
    step: 1,
    total: 1,
    open: null,
  });
  expect(progressOf([])).toBeNull();
});
