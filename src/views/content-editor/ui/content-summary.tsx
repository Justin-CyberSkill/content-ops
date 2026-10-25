import { LinkIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Content } from "@/shared/db/schema";
import { Markdown } from "@/shared/ui/markdown";

/**
 * An item as people read it: the goal, the facts that decide how it gets made, and
 * its reference links and sources. The idea itself is the page title, so it isn't repeated here.
 * `header`, `children` and `footer` let a proposal add who sent it, why, and its history.
 * Once approved, `origin` keeps saying an agent proposed it and who approved it.
 */
export function ContentSummary({
  item,
  schedule,
  assigneeName,
  origin,
  header,
  children,
  footer,
}: {
  item: Content;
  /** Publish day and golden time, formatted; null without a day. */
  schedule: string | null;
  /** Left out on proposals: who does what is chosen when approving. */
  assigneeName?: string | null;
  /** Set on an approved agent idea: the agent's name and who approved it, if still a member. */
  origin?: { agent: string; approvedBy: string | null };
  header?: React.ReactNode;
  children?: React.ReactNode;
  /** Shown last, after the sources, such as a proposal's history. */
  footer?: React.ReactNode;
}) {
  const t = useTranslations();
  const facts = [
    {
      label: t("contentEditor.contentType"),
      value: t(`content.type.${item.type}`),
    },
    {
      label: t("contentEditor.platforms"),
      value: item.platforms
        .map((platform) => t(`content.platform.${platform}`))
        .join(", "),
    },
    {
      label: t("contentEditor.publishDay"),
      value: schedule ?? t("common.noDate"),
    },
    ...(assigneeName === undefined
      ? []
      : [
          {
            label: t("contentEditor.assignee"),
            value: assigneeName ?? t("common.unassigned"),
          },
        ]),
  ];
  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7"
    >
      {header ?? (
        <h2 id="summary-heading" className="text-lg font-semibold">
          {t("contentEditor.details")}
        </h2>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-xs text-muted-foreground">
          {t("contentEditor.goal")}
        </h3>
        <Markdown className="max-w-prose">{item.goal}</Markdown>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 2xl:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="break-words tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {origin ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <SparklesIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-status-proposed"
          />
          {origin.approvedBy
            ? t("contentEditor.fromAgentApproved", {
                agent: origin.agent,
                name: origin.approvedBy,
              })
            : t("contentEditor.fromAgent", { agent: origin.agent })}
        </p>
      ) : null}

      {item.assetLinks.length ? (
        <div className="flex flex-col gap-1.5">
          <h3 className="font-sans text-xs text-muted-foreground">
            {t("contentEditor.referenceLinks")}
          </h3>
          <ul className="flex flex-col gap-1">
            {item.assetLinks.map((link) => (
              <li key={link} className="min-w-0">
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
                >
                  <LinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{link}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children}

      {item.sources.length ? (
        <div className="flex flex-col gap-1.5">
          <h3 className="font-sans text-xs text-muted-foreground">
            {t("contentEditor.sources")}
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {item.sources.map((source) => (
              <li key={source} className="min-w-0 break-words">
                {URL.canParse(source) && /^https?:/.test(source) ? (
                  <a
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 font-medium text-accent-foreground underline-offset-4 hover:underline"
                  >
                    <LinkIcon
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{source}</span>
                  </a>
                ) : (
                  source
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {footer}
    </section>
  );
}
