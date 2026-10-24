import type { ContentStatus, TaskStatus } from "@/shared/db/schema";

/** The parts of a task that decide what opens next and how the idea shows. */
export type FlowTask = {
  id: string;
  position: number;
  status: TaskStatus;
  /** What the idea shows as while this task is the open one. */
  ideaStatus: ContentStatus;
  assigneeId: string | null;
};

const byPosition = <T extends { position: number }>(tasks: T[]) =>
  [...tasks].sort((a, b) => a.position - b.position);

/**
 * Tasks open one at a time, in order. The first task that isn't done is open
 * (a waiting one becomes To do); every task after it that isn't done waits.
 * Returns only the tasks whose status changes.
 */
export function advanceTasks<T extends FlowTask>(
  tasks: T[],
): { id: string; status: TaskStatus }[] {
  const changes: { id: string; status: TaskStatus }[] = [];
  let openFound = false;
  for (const task of byPosition(tasks)) {
    if (task.status === "done") continue;
    if (!openFound) {
      openFound = true;
      if (task.status === "waiting")
        changes.push({ id: task.id, status: "todo" });
    } else if (task.status !== "waiting") {
      changes.push({ id: task.id, status: "waiting" });
    }
  }
  return changes;
}

/**
 * How the idea shows on the plan, and who has it now. Planned until work starts;
 * then the open task's status; Published when every task is done.
 */
export function ideaProgress(tasks: FlowTask[]): {
  status: ContentStatus;
  assigneeId: string | null;
} {
  const ordered = byPosition(tasks);
  const open = ordered.find((task) => task.status !== "done");
  if (!open)
    return {
      status: "published",
      assigneeId: ordered.at(-1)?.assigneeId ?? null,
    };
  const started = ordered.some(
    (task) => task.status === "done" || task.status === "in_progress",
  );
  return {
    status: started ? open.ideaStatus : "planned",
    assigneeId: open.assigneeId,
  };
}

/** The day a task is due: `daysBefore` days before the publish day. Null without a publish day. */
export function dueDate(
  publishDate: string | null,
  daysBefore: number,
): string | null {
  if (!publishDate) return null;
  const day = new Date(`${publishDate}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - daysBefore);
  return day.toISOString().slice(0, 10);
}

export type Candidate = {
  id: string;
  name: string;
  /** Open tasks they already have. */
  load: number;
  /** When they were last given a task; null if never. */
  lastAssignedAt: Date | null;
};

/**
 * Who to suggest for each step: of the members who do that work, the one with the
 * fewest open tasks, then whoever was given a task least recently, then by name.
 * Each pick counts toward the next, so one idea's steps spread across people.
 */
export function suggestAssignees(
  steps: { id: string; workTypeId: string }[],
  candidatesByWorkType: Map<string, Candidate[]>,
): Map<string, string | null> {
  const load = new Map<string, number>();
  // A pick in this idea counts as the most recent assignment, after any real one.
  const lastPicked = new Map<string, number>();
  const picked = new Map<string, string | null>();
  const loadOf = (candidate: Candidate) =>
    load.get(candidate.id) ?? candidate.load;
  const lastOf = (candidate: Candidate) =>
    lastPicked.get(candidate.id) ?? candidate.lastAssignedAt?.getTime() ?? 0;
  steps.forEach((step, index) => {
    const candidates = candidatesByWorkType.get(step.workTypeId) ?? [];
    const best = [...candidates].sort(
      (a, b) =>
        loadOf(a) - loadOf(b) ||
        lastOf(a) - lastOf(b) ||
        a.name.localeCompare(b.name),
    )[0];
    picked.set(step.id, best?.id ?? null);
    if (best) {
      load.set(best.id, loadOf(best) + 1);
      lastPicked.set(best.id, Number.MAX_SAFE_INTEGER - steps.length + index);
    }
  });
  return picked;
}
