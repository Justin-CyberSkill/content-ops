import type { ContentStatus } from "@/shared/db/schema";
import { Badge } from "@/shared/ui/badge";
import { statusLabels } from "../config/labels";

const variants: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  proposed: "outline",
  planned: "outline",
  in_progress: "secondary",
  in_review: "secondary",
  scheduled: "default",
  published: "default",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>;
}
