import { ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { contentHref } from "@/entities/content";
import { DEFAULT_LOCALE, isLocale, Link } from "@/shared/i18n";
import { MarkdownPreview } from "@/shared/ui/markdown";
import type { ClosedProposal } from "../api/list-proposals";
import { formatProposedAt } from "../lib/format-proposed-at";

/**
 * Rejected and withdrawn ideas from the last 30 days, folded under the queue like
 * Published on the content plan. Each row opens the idea, where a withdrawn one can be restored.
 */
export function ClosedProposals({
  proposals,
  timeZone,
}: {
  proposals: ClosedProposal[];
  timeZone: string;
}) {
  const t = useTranslations("review");
  const current = useLocale();
  const locale = isLocale(current) ? current : DEFAULT_LOCALE;
  const now = new Date();
  if (!proposals.length) return null;

  return (
    <details className="group/section flex max-w-3xl flex-col gap-2">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-open/section:rotate-90"
        />
        <h2 className="flex items-baseline gap-2 text-sm font-semibold">
          {t("closedTitle")}
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {proposals.length}
          </span>
        </h2>
      </summary>
      <ul className="flex flex-col gap-1 pt-2">
        {proposals.map((proposal) => {
          const time = formatProposedAt(
            proposal.closed.at,
            locale,
            timeZone,
            now,
          );
          return (
            <li
              key={proposal.id}
              className="relative flex min-w-0 flex-col gap-0.5 rounded-xl px-3 py-2.5 hover:bg-muted has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-ring"
            >
              <Link
                href={contentHref(proposal.id, "review")}
                className="truncate font-medium outline-none after:absolute after:inset-0 after:rounded-xl"
              >
                {proposal.idea}
              </Link>
              <p className="truncate text-[13px] text-muted-foreground">
                <span className="tabular-nums">
                  {proposal.closed.as === "rejected"
                    ? t("closedRejected", { time })
                    : t("closedWithdrawn", {
                        name: proposal.proposedByName ?? t("unknownAgent"),
                        time,
                      })}
                </span>
                {proposal.closed.reason ? (
                  <>
                    {" · "}
                    <MarkdownPreview>{proposal.closed.reason}</MarkdownPreview>
                  </>
                ) : null}
              </p>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
