import { SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatSchedule } from "@/entities/content";
import { DEFAULT_LOCALE, isLocale, Link } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import type { Proposal } from "../api/list-proposals";

export function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const t = useTranslations();
  const current = useLocale();
  const locale = isLocale(current) ? current : DEFAULT_LOCALE;

  if (!proposals.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-14 text-center shadow-card">
        <h2 className="text-lg font-semibold">{t("review.emptyTitle")}</h2>
        <p className="text-muted-foreground">{t("review.emptyBody")}</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {proposals.map((proposal) => {
        const schedule = formatSchedule(
          proposal.publishDate,
          proposal.goldenTime,
          locale,
        );
        return (
          <li
            key={proposal.id}
            className="flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
          >
            <div className="flex items-center gap-2 text-[13px] text-status-proposed">
              <SparklesIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate font-semibold">
                {proposal.proposedByName ?? t("review.unknownAgent")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold break-words">
                {proposal.idea}
              </h2>
              <p className="text-sm text-muted-foreground break-words">
                {proposal.goal}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {t(`content.type.${proposal.type}`)}
              </Badge>
              {proposal.platforms.map((platform) => (
                <Badge key={platform} variant="outline">
                  {t(`content.platform.${platform}`)}
                </Badge>
              ))}
              <Badge variant="secondary">
                {schedule ?? t("common.noDate")}
              </Badge>
            </div>
            {proposal.proposalReason ? (
              <div className="flex flex-col gap-1 rounded-xl bg-status-proposed-bg p-4">
                <h3 className="text-[13px] font-semibold text-status-proposed">
                  {t("review.whyThis")}
                </h3>
                <p className="line-clamp-4 text-sm break-words whitespace-pre-wrap">
                  {proposal.proposalReason}
                </p>
              </div>
            ) : null}
            <Link
              href={`/content/${proposal.id}`}
              aria-label={t("review.openLabel", { idea: proposal.idea })}
              className={buttonVariants({
                size: "sm",
                className: "mt-auto self-start",
              })}
            >
              {t("review.open")}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
