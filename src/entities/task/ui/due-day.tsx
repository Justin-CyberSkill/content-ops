import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib";
import { formatDueDay } from "../lib/due-day";

/** "Due Thu 30 Oct", or "Overdue: Tue 28 Oct" in red once the day has passed and it isn't done. */
export function DueDay({
  dueDate,
  today,
  done,
  className,
}: {
  dueDate: string | null;
  /** Today in the team's zone. */
  today: string;
  done: boolean;
  className?: string;
}) {
  const t = useTranslations("task");
  const locale = useLocale();
  if (!dueDate) return null;
  const day = formatDueDay(dueDate, today, locale);
  const overdue = !done && dueDate < today;
  return (
    <span
      className={cn(
        "tabular-nums",
        overdue && "font-medium text-destructive",
        className,
      )}
    >
      {overdue ? t("overdue", { day }) : t("due", { day })}
    </span>
  );
}
