import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatSchedule, StatusBadge } from "@/entities/content";
import { Avatar } from "@/shared/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { ContentRow } from "../api/list-content";

export function ContentTable({ rows }: { rows: ContentRow[] }) {
  const t = useTranslations();
  const locale = useLocale();
  if (!rows.length)
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted px-6 py-12 text-center">
        <p className="font-heading text-lg font-semibold">
          {t("contentList.emptyTitle")}
        </p>
        <p className="text-muted-foreground">{t("contentList.emptyBody")}</p>
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("contentList.columns.publish")}</TableHead>
          <TableHead>{t("contentList.columns.idea")}</TableHead>
          <TableHead>{t("contentList.columns.platforms")}</TableHead>
          <TableHead>{t("contentList.columns.type")}</TableHead>
          <TableHead>{t("contentList.columns.assignee")}</TableHead>
          <TableHead>{t("contentList.columns.status")}</TableHead>
          <TableHead>{t("contentList.columns.assets")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium whitespace-nowrap tabular-nums">
              {formatSchedule(row.publishDate, row.goldenTime, locale) ??
                t("common.noDate")}
            </TableCell>
            <TableCell className="max-w-xs whitespace-normal">
              <Link
                href={`/content/${row.id}`}
                className="font-semibold hover:underline"
              >
                {row.idea}
              </Link>
              <p className="line-clamp-1 text-[13px] text-muted-foreground">
                {row.goal}
              </p>
            </TableCell>
            <TableCell className="whitespace-normal">
              <ul className="flex flex-wrap gap-1">
                {row.platforms.map((p) => (
                  <li
                    key={p}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {t(`content.platform.${p}`)}
                  </li>
                ))}
              </ul>
            </TableCell>
            <TableCell className="text-[13px]">
              {t(`content.type.${row.type}`)}
            </TableCell>
            <TableCell>
              {row.assigneeName ? (
                <span className="flex items-center gap-2 text-[13px]">
                  <Avatar name={row.assigneeName} size="sm" />
                  {row.assigneeName}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="size-7 rounded-full border-[1.5px] border-dashed border-muted-foreground"
                  />
                  {t("common.unassigned")}
                </span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                {row.assetLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-foreground underline-offset-4 hover:underline"
                  >
                    <LinkIcon aria-hidden="true" className="size-3.5" />
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
