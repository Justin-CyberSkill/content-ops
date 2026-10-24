import { useTranslations } from "next-intl";
import { Badge } from "@/shared/ui/badge";

/** Marks what changed after the last review, so the reviewer checks only that. */
export function SinceReviewBadge() {
  const t = useTranslations("contentEditor");
  return (
    <Badge className="h-6 bg-status-in-review-bg px-2.5 text-status-in-review">
      {t("sinceReview")}
    </Badge>
  );
}
