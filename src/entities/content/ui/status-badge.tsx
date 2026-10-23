import { useTranslations } from "next-intl";
import type { ContentStatus } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";

// Full class names so Tailwind can see them. Tokens live in globals.css.
export const statusColorClasses: Record<ContentStatus, string> = {
  proposed: "bg-status-proposed-bg text-status-proposed",
  planned: "bg-status-planned-bg text-status-planned",
  in_progress: "bg-status-in-progress-bg text-status-in-progress",
  in_review: "bg-status-in-review-bg text-status-in-review",
  scheduled: "bg-status-scheduled-bg text-status-scheduled",
  published: "bg-status-published-bg text-status-published",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const t = useTranslations("content.status");
  return (
    <Badge className={cn("pl-2.5", statusColorClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </Badge>
  );
}
