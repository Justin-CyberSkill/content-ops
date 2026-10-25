import { CheckIcon, Undo2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReviewVerdict } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Markdown } from "@/shared/ui/markdown";

export type ReviewEntry = {
  id: string;
  verdict: ReviewVerdict;
  note: string;
  reopenedTasks: string[];
  reviewerName: string | null;
  /** ISO time, for the <time> element. */
  createdAt: string;
  /** Already formatted in the team's time zone. */
  time: string;
};

/** Each review's verdict, newest first: who decided, what they asked for, and what went back. */
export function ReviewHistory({ reviews }: { reviews: ReviewEntry[] }) {
  const t = useTranslations("contentEditor.reviews");
  const locale = useLocale();
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  return (
    <section
      aria-labelledby="reviews-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card md:p-7"
    >
      <h2 id="reviews-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <ol className="flex flex-col gap-4">
        {reviews.map((entry) => {
          const approved = entry.verdict === "approved";
          const name = entry.reviewerName ?? t("removedMember");
          return (
            <li key={entry.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                  approved
                    ? "bg-status-published-bg text-status-published"
                    : "bg-status-in-review-bg text-status-in-review",
                )}
              >
                {approved ? (
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                ) : (
                  <Undo2Icon className="size-3.5" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold">
                    {approved
                      ? t("approved", { name })
                      : t("changesRequested", { name })}
                  </span>
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {entry.time}
                  </time>
                </div>
                {entry.note ? (
                  <Markdown className="max-w-prose text-sm" headingLevel={3}>
                    {entry.note}
                  </Markdown>
                ) : null}
                {entry.reopenedTasks.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t("sentBack", { tasks: list.format(entry.reopenedTasks) })}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
