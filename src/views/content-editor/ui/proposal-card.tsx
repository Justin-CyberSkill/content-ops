import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Content } from "@/shared/db/schema";
import { ContentSummary } from "./content-summary";

/** The proposal as a read-only summary, with who sent it, when, and why. */
export function ProposalCard({
  item,
  proposedAt,
  schedule,
  assigneeName,
}: {
  item: Content;
  /** When the agent sent it, already formatted for the reader. */
  proposedAt: string;
  /** Publish day and golden time, formatted; null without a day. */
  schedule: string | null;
  assigneeName: string | null;
}) {
  const t = useTranslations("contentEditor.proposal");
  return (
    <ContentSummary
      item={item}
      schedule={schedule}
      assigneeName={assigneeName}
      header={
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-proposed-bg text-status-proposed"
          >
            <SparklesIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id="summary-heading" className="text-lg font-semibold">
              {t("title", { name: item.proposedByName ?? t("unknownAgent") })}
            </h2>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {proposedAt}
            </p>
          </div>
        </div>
      }
    >
      {item.proposalReason ? (
        <div className="flex flex-col gap-1 rounded-xl bg-status-proposed-bg p-4">
          <h3 className="text-[13px] font-semibold text-status-proposed">
            {t("whyThis")}
          </h3>
          <p className="max-w-prose text-sm break-words whitespace-pre-wrap">
            {item.proposalReason}
          </p>
        </div>
      ) : null}
      {item.rejectedAt ? (
        <div className="flex flex-col gap-1 rounded-xl bg-destructive-soft p-4">
          <h3 className="text-[13px] font-semibold text-destructive">
            {t("rejectedTitle")}
          </h3>
          <p className="text-sm break-words whitespace-pre-wrap">
            {item.rejectionReason}
          </p>
        </div>
      ) : null}
    </ContentSummary>
  );
}
