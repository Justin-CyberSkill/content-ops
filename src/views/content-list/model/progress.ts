import type { TaskStatus } from "@/shared/db/schema";

type TaskLike = { name: string; status: TaskStatus; dueDate: string | null };

/** Where an item stands: the task in hand (its 1-based step), out of how many. */
export type PlanProgress = {
  step: number;
  total: number;
  open: { name: string; dueDate: string | null } | null;
} | null;

/**
 * From an item's tasks in order: the first one not done is the one in hand. Null for
 * an item without tasks, so the plan shows only its status.
 */
export function progressOf(tasks: TaskLike[]): PlanProgress {
  if (!tasks.length) return null;
  const index = tasks.findIndex((item) => item.status !== "done");
  if (index < 0) return { step: tasks.length, total: tasks.length, open: null };
  const { name, dueDate } = tasks[index];
  return { step: index + 1, total: tasks.length, open: { name, dueDate } };
}
