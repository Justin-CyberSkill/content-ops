import { expect, test } from "vitest";
import type { MyTask } from "../api/list-my-tasks";
import { groupTasks } from "./task-groups";

const item: MyTask["item"] = {
  id: "item",
  idea: "Reel",
  goal: "Grow",
  platforms: ["tiktok"],
  type: "short_video",
  publishDate: "2026-10-30",
  goldenTime: null,
  status: "in_progress",
  assetLinks: [],
};

const row = (
  key: string,
  status: NonNullable<MyTask["task"]>["status"],
  dueDate: string | null,
): MyTask => ({
  key,
  task: {
    id: key,
    name: key,
    status,
    dueDate,
    waitingFor: null,
    kind: "make",
    changesRequested: null,
    live: [],
  },
  item,
});

test("puts open work first, soonest due first, and undated last", () => {
  const groups = groupTasks([
    row("later", "todo", "2026-10-29"),
    row("undated", "in_progress", null),
    row("soon", "todo", "2026-10-25"),
  ]);
  expect(groups.todo.map((task) => task.key)).toEqual([
    "soon",
    "later",
    "undated",
  ]);
});

test("keeps waiting and finished work apart, latest finished first", () => {
  const groups = groupTasks([
    row("waiting", "waiting", "2026-10-29"),
    row("old", "done", "2026-10-20"),
    row("new", "done", "2026-10-23"),
    { key: "whole", task: null, item: { ...item, status: "published" } },
    { key: "open item", task: null, item },
  ]);
  expect(groups.waiting.map((task) => task.key)).toEqual(["waiting"]);
  expect(groups.done.map((task) => task.key)).toEqual(["whole", "new", "old"]);
  expect(groups.todo.map((task) => task.key)).toEqual(["open item"]);
});
