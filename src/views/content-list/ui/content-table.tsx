import Link from "next/link";
import {
  contentTypeLabels,
  formatSchedule,
  platformLabels,
  StatusBadge,
} from "@/entities/content";
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
  if (!rows.length)
    return (
      <p className="text-muted-foreground">
        Nothing planned yet. Add the first piece of content.
      </p>
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Publish</TableHead>
          <TableHead>Idea</TableHead>
          <TableHead>Platforms</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assets</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap">
              {formatSchedule(row.publishDate, row.goldenTime)}
            </TableCell>
            <TableCell className="max-w-xs whitespace-normal">
              <Link
                href={`/content/${row.id}`}
                className="font-medium hover:underline"
              >
                {row.idea}
              </Link>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {row.goal}
              </p>
            </TableCell>
            <TableCell className="whitespace-normal">
              {row.platforms.map((p) => platformLabels[p]).join(", ")}
            </TableCell>
            <TableCell>{contentTypeLabels[row.type]}</TableCell>
            <TableCell>
              {row.assigneeName ?? (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                {row.assetLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-sm underline-offset-4 hover:underline"
                  >
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
