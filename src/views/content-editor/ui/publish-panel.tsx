"use client";

import { CheckIcon, CircleIcon, ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Platform } from "@/shared/db/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { type LiveLinkState, saveLiveLink } from "../api/live-links";
import { CopyButton } from "./copy-button";

export type PublishRow = {
  platform: Platform;
  /** The caption and hashtags as they're posted. */
  postText: string;
  pinnedComment: string;
  liveUrl: string | null;
  publishedByName: string | null;
  /** When it went live, already formatted for the reader. */
  publishedTime: string | null;
};

/**
 * Publishing as a checklist: for each platform, copy what to post, post it, then
 * paste where it went live. Every platform with a link finishes the task.
 */
export function PublishPanel({
  contentId,
  taskName,
  canEdit,
  rows,
}: {
  contentId: string;
  /** The publishing task's name, such as Publishing. */
  taskName: string;
  /** Whoever has the publishing task, or an admin. */
  canEdit: boolean;
  rows: PublishRow[];
}) {
  const t = useTranslations("contentEditor.publish");
  const live = rows.filter((row) => row.liveUrl).length;
  return (
    <section
      aria-labelledby="publish-heading"
      className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="publish-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {t("liveCount", { live, total: rows.length })}
        </span>
      </div>
      <p className="text-[13px] text-muted-foreground">
        {t("hint", { task: taskName })}
      </p>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <PlatformRow
            key={row.platform}
            contentId={contentId}
            row={row}
            canEdit={canEdit}
          />
        ))}
      </ul>
    </section>
  );
}

function PlatformRow({
  contentId,
  row,
  canEdit,
}: {
  contentId: string;
  row: PublishRow;
  canEdit: boolean;
}) {
  const t = useTranslations();
  const platform = t(`content.platform.${row.platform}`);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(row.liveUrl ?? "");
  const [state, setState] = useState<LiveLinkState>({});
  const [pending, startTransition] = useTransition();
  const inputId = `live-${row.platform}`;

  const save = () =>
    startTransition(async () => {
      const result = await saveLiveLink(contentId, row.platform, url);
      setState(result);
      if (result.saved) setEditing(false);
    });

  return (
    <li className="flex flex-col gap-2.5 py-3.5 [&+&]:border-t [&+&]:border-border">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          {row.liveUrl ? (
            <CheckIcon
              aria-hidden="true"
              className="size-4 text-status-published"
              strokeWidth={3}
            />
          ) : (
            <CircleIcon
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
          )}
          {platform}
        </span>
        <span
          className={
            row.liveUrl
              ? "text-[13px] font-medium text-status-published"
              : "text-[13px] text-muted-foreground"
          }
        >
          {row.liveUrl
            ? t("contentEditor.publish.live")
            : t("contentEditor.publish.notLive")}
        </span>
      </div>
      {row.postText || row.pinnedComment ? (
        <div className="flex flex-wrap gap-2">
          {row.postText ? (
            <CopyButton
              text={row.postText}
              label={t("contentEditor.publish.copyPostFor", { platform })}
            >
              {t("contentEditor.publish.copyPost")}
            </CopyButton>
          ) : null}
          {row.pinnedComment ? (
            <CopyButton
              text={row.pinnedComment}
              label={t("contentEditor.publish.copyPinnedFor", { platform })}
            >
              {t("contentEditor.publish.copyPinned")}
            </CopyButton>
          ) : null}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          {t("contentEditor.publish.noCaption")}
        </p>
      )}
      {row.liveUrl && !editing ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={row.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-accent-foreground underline-offset-4 hover:underline"
          >
            <ExternalLinkIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{row.liveUrl}</span>
          </a>
          {row.publishedTime ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("contentEditor.publish.publishedBy", {
                name:
                  row.publishedByName ??
                  t("contentEditor.assets.removedMember"),
                time: row.publishedTime,
              })}
            </span>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("contentEditor.publish.changeLabel", { platform })}
              onClick={() => setEditing(true)}
            >
              {t("contentEditor.publish.change")}
            </Button>
          ) : null}
        </div>
      ) : canEdit ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            {t("contentEditor.publish.linkLabel", { platform })}
          </label>
          <Input
            id={inputId}
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://…"
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={state.error ? true : undefined}
            className="h-9"
            autoFocus={editing}
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending || url.trim() === (row.liveUrl ?? "")}
          >
            {pending
              ? t("contentEditor.publish.saving")
              : t("contentEditor.publish.save")}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setUrl(row.liveUrl ?? "");
                setState({});
              }}
            >
              {t("common.cancel")}
            </Button>
          ) : null}
        </form>
      ) : null}
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
