import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Content } from "@/shared/db/schema";

/**
 * An item as people read it: the goal, the facts that decide how it gets made, and
 * its asset links. The idea itself is the page title, so it isn't repeated here.
 * `header` and `children` let a proposal add who sent it and why.
 */
export function ContentSummary({
  item,
  schedule,
  assigneeName,
  header,
  children,
}: {
  item: Content;
  /** Publish day and golden time, formatted; null without a day. */
  schedule: string | null;
  assigneeName: string | null;
  header?: React.ReactNode;
  children?: React.ReactNode;
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
    {
      label: t("contentEditor.assignee"),
      value: assigneeName ?? t("common.unassigned"),
    },
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
        <h3 className="text-xs text-muted-foreground">
          {t("contentEditor.goal")}
        </h3>
        <p className="break-words">{item.goal}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 2xl:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="break-words tabular-nums">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {item.assetLinks.length ? (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs text-muted-foreground">
            {t("contentEditor.assetLinks")}
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
    </section>
  );
}
