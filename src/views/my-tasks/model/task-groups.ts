import type { MyTask } from "../api/list-my-tasks";

export type TaskGroups = { todo: MyTask[]; waiting: MyTask[]; done: MyTask[] };

/** The day a row is about: its task's due day, or for a whole item, its publish day. */
const dayOf = (row: MyTask) => row.task?.dueDate ?? row.item.publishDate;

function bySoonest(a: MyTask, b: MyTask) {
  const dayA = dayOf(a);
  const dayB = dayOf(b);
  if (dayA !== dayB) {
    if (!dayA) return 1;
    if (!dayB) return -1;
    return dayA < dayB ? -1 : 1;
  }
  return (a.item.goldenTime ?? "").localeCompare(b.item.goldenTime ?? "");
}

/**
 * What to work on now (soonest due first), what comes to you after someone else
 * finishes, and what you finished, latest first.
 */
export function groupTasks(rows: MyTask[]): TaskGroups {
  const groups: TaskGroups = { todo: [], waiting: [], done: [] };
  for (const row of rows) {
    const status = row.task?.status;
    if (status === "done" || (!row.task && row.item.status === "published"))
      groups.done.push(row);
    else if (status === "waiting") groups.waiting.push(row);
    else groups.todo.push(row);
  }
  groups.todo.sort(bySoonest);
  groups.waiting.sort(bySoonest);
  groups.done.sort((a, b) => bySoonest(b, a));
  return groups;
}
