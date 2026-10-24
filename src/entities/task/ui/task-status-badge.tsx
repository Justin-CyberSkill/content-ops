import { useTranslations } from "next-intl";
import type { TaskStatus } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";

// The content status colours, so a task and the idea it moves read alike. Tokens live in globals.css.
export const taskStatusColorClasses: Record<TaskStatus, string> = {
  waiting: "bg-muted text-muted-foreground",
  todo: "bg-status-planned-bg text-status-planned",
  in_progress: "bg-status-in-progress-bg text-status-in-progress",
  done: "bg-status-published-bg text-status-published",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const t = useTranslations("task.status");
  return (
    <Badge className={cn("pl-2.5", taskStatusColorClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </Badge>
  );
}
