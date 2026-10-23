import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Content } from "@/shared/db/schema";

/** What the agent said about its idea, above the form an admin reviews it in. */
export function ProposalCard({ item }: { item: Content }) {
  const t = useTranslations("contentEditor.proposal");
  const rejected = item.rejectedAt !== null;
  return (
    <section
      aria-labelledby="proposal-heading"
      className="flex flex-col gap-4 rounded-2xl bg-status-proposed-bg p-6 text-foreground md:p-7"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-status-proposed"
        >
          <SparklesIcon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="proposal-heading" className="text-lg font-semibold">
            {t("title", { name: item.proposedByName ?? t("unknownAgent") })}
          </h2>
          {rejected ? null : (
            <p className="text-[13px] text-muted-foreground">
              {t("reviewHint")}
            </p>
          )}
        </div>
      </div>
      {item.proposalReason ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-semibold text-status-proposed">
            {t("whyThis")}
          </h3>
          <p className="text-sm break-words whitespace-pre-wrap">
            {item.proposalReason}
          </p>
        </div>
      ) : null}
      {rejected ? (
        <div className="flex flex-col gap-1 rounded-xl bg-card p-4">
          <h3 className="text-[13px] font-semibold text-destructive">
            {t("rejectedTitle")}
          </h3>
          <p className="text-sm break-words whitespace-pre-wrap">
            {item.rejectionReason}
          </p>
        </div>
      ) : null}
    </section>
  );
}
