import { ArrowRightIcon, BotIcon, InboxIcon, SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { contentHref, formatSchedule } from "@/entities/content";
import { DEFAULT_LOCALE, isLocale, Link } from "@/shared/i18n";
import { buttonVariants } from "@/shared/ui/button";
import { MarkdownPreview } from "@/shared/ui/markdown";
import type { Proposal } from "../api/list-proposals";
import { formatProposedAt } from "../lib/format-proposed-at";

/**
 * One card per idea, read top to bottom: who sent it and when, the idea, its format
 * and date, and why the agent thinks it works. The whole card opens the decision page.
 */
export function ProposalList({
  proposals,
  timeZone,
}: {
  proposals: Proposal[];
  /** The team's zone, for when each idea was sent. */
  timeZone: string;
}) {
  const t = useTranslations();
  const current = useLocale();
  const locale = isLocale(current) ? current : DEFAULT_LOCALE;
  const now = new Date();

  if (!proposals.length) {
    return (
      <div className="flex max-w-3xl flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center shadow-card">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <InboxIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t("review.emptyTitle")}</h2>
          <p className="max-w-sm text-muted-foreground">
            {t("review.emptyBody")}
          </p>
        </div>
        <Link
          href="/settings/agents"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <BotIcon aria-hidden="true" />
          {t("review.manageAgents")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex max-w-3xl flex-col gap-4">
      {proposals.map((proposal) => {
        const schedule = formatSchedule(
          proposal.publishDate,
          proposal.goldenTime,
          locale,
        );
        const format = [
          t(`content.type.${proposal.type}`),
          proposal.platforms
            .map((platform) => t(`content.platform.${platform}`))
            .join(", "),
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <li
            key={proposal.id}
            className="relative flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-6 shadow-card transition-shadow has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring hover:shadow-float"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
              <SparklesIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-status-proposed"
              />
              <span className="font-semibold text-status-proposed">
                {proposal.proposedByName ?? t("review.unknownAgent")}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {t("review.proposedAt", {
                  time: formatProposedAt(
                    proposal.createdAt,
                    locale,
                    timeZone,
                    now,
                  ),
                })}
                {proposal.revision > 0
                  ? ` · ${t("review.changedAt", {
                      time: formatProposedAt(
                        proposal.updatedAt,
                        locale,
                        timeZone,
                        now,
                      ),
                    })}`
                  : null}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold break-words">
                <Link
                  href={contentHref(proposal.id, "review")}
                  className="outline-none after:absolute after:inset-0 after:rounded-2xl"
                >
                  {proposal.idea}
                </Link>
              </h2>
              <p className="line-clamp-3 text-sm text-muted-foreground break-words">
                <MarkdownPreview>{proposal.goal}</MarkdownPreview>
              </p>
            </div>

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  {t("review.format")}
                </dt>
                <dd className="break-words">{format}</dd>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  {t("review.publish")}
                </dt>
                <dd className="tabular-nums">
                  {schedule ?? t("common.noDate")}
                </dd>
              </div>
            </dl>

            {proposal.proposalReason ? (
              <div className="flex flex-col gap-1 rounded-xl bg-status-proposed-bg p-4">
                <h3 className="text-[13px] font-semibold text-status-proposed">
                  {t("review.whyThis")}
                </h3>
                <p className="line-clamp-3 text-sm break-words">
                  <MarkdownPreview>{proposal.proposalReason}</MarkdownPreview>
                </p>
              </div>
            ) : null}

            <span
              aria-hidden="true"
              // Every card has one, so none is filled: a column of coral buttons would compete.
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "self-start",
              })}
            >
              {t("review.open")}
              <ArrowRightIcon />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
