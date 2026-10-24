import { describe, expect, test } from "vitest";
import {
  advanceTasks,
  type Candidate,
  dueDate,
  type FlowTask,
  ideaProgress,
  suggestAssignees,
  taskKind,
} from "./task-flow";

const flow = (...statuses: FlowTask["status"][]): FlowTask[] =>
  statuses.map((status, position) => ({
    id: `t${position}`,
    position,
    status,
    ideaStatus: (
      ["in_progress", "in_progress", "in_review", "scheduled"] as const
    )[position],
    assigneeId: `u${position}`,
  }));

describe("advanceTasks", () => {
  test("opens the first task of a new idea", () => {
    expect(advanceTasks(flow("waiting", "waiting", "waiting"))).toEqual([
      { id: "t0", status: "todo" },
    ]);
  });

  test("opens the next task when one is done", () => {
    expect(advanceTasks(flow("done", "waiting", "waiting"))).toEqual([
      { id: "t1", status: "todo" },
    ]);
  });

  test("puts later tasks back to waiting when an earlier one reopens", () => {
    expect(advanceTasks(flow("in_progress", "todo", "waiting"))).toEqual([
      { id: "t1", status: "waiting" },
    ]);
  });

  test("changes nothing when the order already holds", () => {
    expect(advanceTasks(flow("done", "in_progress", "waiting"))).toEqual([]);
    expect(advanceTasks(flow("done", "done"))).toEqual([]);
  });
});

describe("ideaProgress", () => {
  test("is planned until someone starts", () => {
    expect(ideaProgress(flow("todo", "waiting"))).toEqual({
      status: "planned",
      assigneeId: "u0",
    });
  });

  test("shows the open task's status and owner once work starts", () => {
    expect(ideaProgress(flow("in_progress", "waiting"))).toEqual({
      status: "in_progress",
      assigneeId: "u0",
    });
    expect(ideaProgress(flow("done", "done", "todo", "waiting"))).toEqual({
      status: "in_review",
      assigneeId: "u2",
    });
    expect(ideaProgress(flow("done", "done", "done", "todo"))).toEqual({
      status: "scheduled",
      assigneeId: "u3",
    });
  });

  test("stays in progress when a review sends the first task back", () => {
    const tasks = flow("todo", "waiting", "waiting", "waiting");
    tasks[0].reopened = true;
    expect(ideaProgress(tasks)).toEqual({
      status: "in_progress",
      assigneeId: "u0",
    });
  });

  test("is published when every task is done", () => {
    expect(ideaProgress(flow("done", "done", "done", "done"))).toEqual({
      status: "published",
      assigneeId: "u3",
    });
  });
});

test("taskKind follows what the idea shows while the task is open", () => {
  expect(taskKind("in_progress")).toBe("make");
  expect(taskKind("in_review")).toBe("review");
  expect(taskKind("scheduled")).toBe("publish");
});

test("dueDate counts back from the publish day", () => {
  expect(dueDate("2026-11-05", 5)).toBe("2026-10-31");
  expect(dueDate("2026-11-05", 0)).toBe("2026-11-05");
  expect(dueDate(null, 3)).toBeNull();
});

describe("suggestAssignees", () => {
  const person = (id: string, load: number, last?: string): Candidate => ({
    id,
    name: id,
    load,
    lastAssignedAt: last ? new Date(last) : null,
  });

  test("picks the member with the fewest open tasks", () => {
    const picks = suggestAssignees(
      [{ id: "s1", workTypeId: "copy" }],
      new Map([["copy", [person("ky", 3), person("an", 1)]]]),
    );
    expect(picks.get("s1")).toBe("an");
  });

  test("breaks ties by who was given a task least recently", () => {
    const picks = suggestAssignees(
      [{ id: "s1", workTypeId: "copy" }],
      new Map([
        [
          "copy",
          [person("ky", 1, "2026-10-20"), person("an", 1, "2026-10-22")],
        ],
      ]),
    );
    expect(picks.get("s1")).toBe("ky");
  });

  test("counts each pick, and leaves a step with nobody unassigned", () => {
    const picks = suggestAssignees(
      [
        { id: "s1", workTypeId: "review" },
        { id: "s2", workTypeId: "review" },
        { id: "s3", workTypeId: "assets" },
      ],
      new Map([["review", [person("justin", 0), person("ky", 1)]]]),
    );
    expect(picks.get("s1")).toBe("justin");
    expect(picks.get("s2")).toBe("ky");
    expect(picks.get("s3")).toBeNull();
  });
});
