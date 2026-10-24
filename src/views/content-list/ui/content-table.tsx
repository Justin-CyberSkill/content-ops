import { ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StatusBadge } from "@/entities/content";
import { Link } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Avatar } from "@/shared/ui/avatar";
import { buttonVariants } from "@/shared/ui/button";
import type { ContentRow } from "../api/list-content";
import { formatDay } from "../lib/format-day";
import { type ContentGroup, groupContent } from "../model/content-groups";
import { AssetLinksMenu } from "./asset-links-menu";

/*
 * One grid per item instead of a <table>, so the same markup can be a card on a phone,
 * a two-line row on a tablet and a one-line row from 1440px up.
 *   phone:  when · status / content / owner · format · links
 *   lg:     when | content + (owner · format · links) | status
 *   1440px: when | content | status | owner | format | links
 */
const itemGrid = cn(
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5",
  "[grid-template-areas:'when_status'_'content_content'_'meta_meta']",
  "lg:grid-cols-[6.5rem_minmax(0,1fr)_auto] lg:[grid-template-areas:'when_content_status'_'when_meta_status']",
  "min-[90rem]:grid-cols-[6.5rem_minmax(0,1fr)_8.5rem_10.5rem_10rem_3.5rem] min-[90rem]:items-center min-[90rem]:[grid-template-areas:'when_content_status_owner_format_links']",
);

// Published history is done: keep it out of the way until someone opens it.
const COLLAPSED: ContentGroup[] = ["published"];

export function ContentTable({
  rows,
  today,
}: {
  rows: ContentRow[];
  today: string;
}) {
  const t = useTranslations();
  if (!rows.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-muted px-6 py-12 text-center">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-semibold">
            {t("contentList.emptyTitle")}
          </p>
          <p className="max-w-sm text-muted-foreground">
            {t("contentList.emptyBody")}
          </p>
        </div>
        <Link href="/content/new" className={buttonVariants({ size: "sm" })}>
          {t("contentList.newContent")}
        </Link>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <div
        aria-hidden="true"
        className={cn(
          itemGrid,
          "hidden px-3 text-xs font-medium text-muted-foreground min-[90rem]:grid",
        )}
      >
        <span className="[grid-area:when]">
          {t("contentList.columns.publish")}
        </span>
        <span className="[grid-area:content]">
          {t("contentList.columns.idea")}
        </span>
        <span className="[grid-area:status]">
          {t("contentList.columns.status")}
        </span>
        <span className="[grid-area:owner]">
          {t("contentList.columns.assignee")}
        </span>
        <span className="[grid-area:format]">
          {t("contentList.columns.format")}
        </span>
        <span className="[grid-area:links]">
          {t("contentList.columns.assets")}
        </span>
      </div>
      {groupContent(rows, today).map(({ group, rows }) => (
        <ContentSection key={group} group={group} rows={rows} today={today} />
      ))}
    </div>
  );
}

function ContentSection({
  group,
  rows,
  today,
}: {
  group: ContentGroup;
  rows: ContentRow[];
  today: string;
}) {
  const t = useTranslations("contentList");
  const heading = (
    <h2 className="flex items-baseline gap-2 text-sm font-semibold">
      {t(`groups.${group}`)}
      <span className="text-xs font-medium text-muted-foreground tabular-nums">
        {rows.length}
      </span>
    </h2>
  );
  const items = (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => (
        <ContentItem key={row.id} row={row} today={today} />
      ))}
    </ul>
  );
  if (COLLAPSED.includes(group))
    return (
      <details className="group/section flex flex-col gap-2">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-muted [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-open/section:rotate-90"
          />
          {heading}
        </summary>
        <div className="pt-2">{items}</div>
      </details>
    );
  return (
    <section className="flex flex-col gap-2">
      <div className={cn("px-3", group === "overdue" && "text-destructive")}>
        {heading}
      </div>
      {items}
    </section>
  );
}

function ContentItem({ row, today }: { row: ContentRow; today: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const platforms = row.platforms
    .map((p) => t(`content.platform.${p}`))
    .join(" · ");
  return (
    <li
      className={cn(
        itemGrid,
        "relative rounded-xl border border-border p-3 transition-colors hover:bg-muted has-[a[data-item-link]:focus-visible]:outline-2 has-[a[data-item-link]:focus-visible]:outline-offset-2 has-[a[data-item-link]:focus-visible]:outline-ring lg:border-transparent",
      )}
    >
      <div className="flex items-baseline gap-2 text-[13px] [grid-area:when] lg:flex-col lg:gap-0.5">
        <span className="font-semibold whitespace-nowrap">
          {row.publishDate
            ? formatDay(row.publishDate, today, locale)
            : t("common.noDate")}
        </span>
        {row.goldenTime ? (
          <span className="text-muted-foreground tabular-nums">
            {row.goldenTime.slice(0, 5)}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 [grid-area:content]">
        <Link
          href={`/content/${row.id}`}
          data-item-link=""
          className="line-clamp-2 font-semibold outline-none after:absolute after:inset-0 after:rounded-xl"
        >
          {row.idea}
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {row.goal}
        </p>
      </div>

      <div className="justify-self-end [grid-area:status] min-[90rem]:justify-self-start">
        <StatusBadge status={row.status} />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 [grid-area:meta] lg:flex lg:flex-wrap min-[90rem]:contents">
        <div className="col-span-2 min-w-0 text-[13px] lg:col-span-1 min-[90rem]:[grid-area:format]">
          <p className="truncate">{t(`content.type.${row.type}`)}</p>
          {platforms ? (
            <p
              className="truncate text-xs text-muted-foreground"
              title={platforms}
            >
              {platforms}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 lg:order-first min-[90rem]:[grid-area:owner]">
          {row.assigneeName ? (
            <span className="flex items-center gap-2 text-[13px]">
              <Avatar name={row.assigneeName} size="sm" />
              <span className="truncate">{row.assigneeName}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full border-[1.5px] border-dashed border-muted-foreground"
              />
              {t("common.unassigned")}
            </span>
          )}
        </div>
        <div className="justify-self-end lg:ml-auto min-[90rem]:ml-0 min-[90rem]:[grid-area:links]">
          {row.assetLinks.length ? (
            <AssetLinksMenu links={row.assetLinks} />
          ) : null}
        </div>
      </div>
    </li>
  );
}
