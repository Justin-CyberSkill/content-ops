import { SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Content, ContentEventAction } from "@/shared/db/schema";
import { Markdown } from "@/shared/ui/markdown";
import { ContentSummary } from "./content-summary";

export type HistoryEntry = {
  id: string;
  action: ContentEventAction;
  actorName: string;
  fields: string[];
  /** When it happened, already formatted for the reader. */
  time: string;
};

const FIELD_KEYS = [
  "goal",
  "idea",
  "platforms",
  "type",
  "publishDate",
  "goldenTime",
  "assetLinks",
  "why",
  "sources",
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];
const isFieldKey = (field: string): field is FieldKey =>
  (FIELD_KEYS as readonly string[]).includes(field);

/** The proposal as a read-only summary, with who sent it, when, why, and what happened since. */
export function ProposalCard({
  item,
  proposedAt,
  schedule,
  history,
}: {
  item: Content;
  /** When the agent sent it, already formatted for the reader. */
  proposedAt: string;
  /** Publish day and golden time, formatted; null without a day. */
  schedule: string | null;
  history: HistoryEntry[];
}) {
  const t = useTranslations("contentEditor.proposal");
  const locale = useLocale();
  const list = new Intl.ListFormat(locale, { type: "conjunction" });
  const describe = (entry: HistoryEntry) =>
    entry.action === "updated"
      ? t("history.updated", {
          name: entry.actorName,
          fields: list.format(
            entry.fields
              .filter(isFieldKey)
              .map((field) => t(`historyFields.${field}`)),
          ),
        })
      : t(`history.${entry.action}`, { name: entry.actorName });
  return (
    <ContentSummary
      item={item}
      schedule={schedule}
      footer={
        // "Proposed" alone repeats the header, so history shows once something else happened.
        history.length > 1 ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="font-sans text-xs text-muted-foreground">
              {t("historyTitle")}
            </h3>
            <ol className="flex flex-col gap-1 text-sm">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-x-2"
                >
                  <span className="break-words">{describe(entry)}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {entry.time}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null
      }
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
            <p className="text-sm text-muted-foreground tabular-nums">
              {proposedAt}
            </p>
          </div>
        </div>
      }
    >
      {item.proposalReason ? (
        <div className="flex flex-col gap-1 rounded-xl bg-status-proposed-bg p-4">
          <h3 className="text-sm font-semibold text-status-proposed">
            {t("whyThis")}
          </h3>
          <Markdown className="max-w-prose text-sm">
            {item.proposalReason}
          </Markdown>
        </div>
      ) : null}
      {item.withdrawnAt ? (
        <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
          <h3 className="text-sm font-semibold">
            {t("withdrawnTitle", {
              name:
                history.findLast((entry) => entry.action === "withdrawn")
                  ?.actorName ??
                item.proposedByName ??
                t("unknownAgent"),
            })}
          </h3>
          {item.withdrawReason ? (
            <Markdown className="max-w-prose text-sm">
              {item.withdrawReason}
            </Markdown>
          ) : (
            <p className="text-sm">{t("noWithdrawReason")}</p>
          )}
        </div>
      ) : null}
      {item.rejectedAt ? (
        <div className="flex flex-col gap-1 rounded-xl bg-destructive-soft p-4">
          <h3 className="text-sm font-semibold text-destructive">
            {t("rejectedTitle")}
          </h3>
          <Markdown className="max-w-prose text-sm">
            {item.rejectionReason ?? ""}
          </Markdown>
        </div>
      ) : null}
    </ContentSummary>
  );
}
