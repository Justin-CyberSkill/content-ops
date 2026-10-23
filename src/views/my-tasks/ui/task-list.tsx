import Link from "next/link";
import {
  contentTypeLabels,
  formatSchedule,
  platformLabels,
} from "@/entities/content";
import type { Task } from "../api/list-my-tasks";
import { StatusSelect } from "./status-select";

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length)
    return (
      <p className="text-muted-foreground">Nothing is assigned to you yet.</p>
    );

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted-foreground text-xs">
              {formatSchedule(task.publishDate, task.goldenTime)} ·{" "}
              {contentTypeLabels[task.type]} ·{" "}
              {task.platforms.map((p) => platformLabels[p]).join(", ")}
            </p>
            <Link
              href={`/content/${task.id}`}
              className="font-medium hover:underline"
            >
              {task.idea}
            </Link>
            <p className="text-muted-foreground text-sm">{task.goal}</p>
            {task.assetLinks.length ? (
              <div className="flex flex-wrap gap-x-3 text-sm">
                {task.assetLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <StatusSelect
            id={task.id}
            status={task.status}
            label={`Status of ${task.idea}`}
          />
        </li>
      ))}
    </ul>
  );
}
