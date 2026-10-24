"use client";

import { CheckIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { Platform } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { type SaveCaptionsState, saveCaptions } from "../api/save-captions";
import {
  CAPTION_LIMITS,
  captionField,
  characterCount,
  postText,
  SCRIPT_MAX_LENGTH,
} from "../model/captions";
import { CopyButton } from "./copy-button";
import { SinceReviewBadge } from "./since-review-badge";

/** One platform's caption, hashtags and pinned comment, as the card shows them. */
export type CaptionsPost = {
  platform: Platform;
  caption: string;
  hashtags: string;
  pinnedComment: string;
  /** Changed after the last review. */
  changed: boolean;
};

/**
 * What Content prep writes: the script, then for each platform what's posted with it.
 * It reads first, with a Copy button on each part for whoever posts it, and opens as
 * a form in place to write or change it. Anyone on the team can.
 */
export function ScriptAndCaptions({
  contentId,
  script,
  scriptView,
  scriptChanged,
  posts,
}: {
  contentId: string;
  /** The Markdown as written, for the form and the Copy button. */
  script: string;
  /** The same script rendered on the server, for reading. */
  scriptView: React.ReactNode;
  /** The script changed after the last review. */
  scriptChanged: boolean;
  /** One per platform the idea is for, in its order. */
  posts: CaptionsPost[];
}) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<SaveCaptionsState, FormData>(
    async (previous, formData) => {
      const result = await saveCaptions(contentId, previous, formData);
      if (result.saved) setEditing(false);
      return result;
    },
    {},
  );
  const empty =
    !script &&
    posts.every(
      (post) => !post.caption && !post.hashtags && !post.pinnedComment,
    );

  return (
    <section
      aria-labelledby="captions-heading"
      className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="captions-heading" className="text-lg font-semibold">
            {t("contentEditor.captions.title")}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {editing
              ? t("contentEditor.captions.editHint")
              : t("contentEditor.captions.intro")}
          </p>
        </div>
        {!editing && !empty ? (
          <div className="flex items-center gap-3">
            {state.saved && !pending ? (
              <span
                role="status"
                className="inline-flex items-center gap-1 text-[13px] text-success"
              >
                <CheckIcon aria-hidden="true" className="size-3.5" />
                {t("contentEditor.saved")}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <PencilIcon aria-hidden="true" />
              {t("contentEditor.captions.edit")}
            </Button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form action={action} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="script">{t("contentEditor.captions.script")}</Label>
            <Textarea
              id="script"
              name="script"
              rows={6}
              defaultValue={script}
              maxLength={SCRIPT_MAX_LENGTH}
              aria-describedby="script-hint"
              autoFocus
            />
            <p id="script-hint" className="pl-1 text-xs text-muted-foreground">
              {t("contentEditor.captions.scriptHint")}{" "}
              {t("contentEditor.markdownHint")}
            </p>
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            {posts.map((post) => (
              <PlatformFields key={post.platform} post={post} />
            ))}
          </div>
          {state.error ? (
            <p role="alert" className="pl-1 text-xs text-destructive">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("common.saving") : t("contentEditor.captions.save")}
            </Button>
          </div>
        </form>
      ) : empty ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[13px] text-muted-foreground">
            {t("contentEditor.captions.empty")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <PencilIcon aria-hidden="true" />
            {t("contentEditor.captions.write")}
          </Button>
        </div>
      ) : (
        <>
          <CopyField
            label={t("contentEditor.captions.script")}
            text={script}
            view={scriptView}
            empty={t("contentEditor.captions.noScript")}
            copyLabel={t("contentEditor.captions.copyScript")}
            badge={scriptChanged ? <SinceReviewBadge /> : null}
          />
          <div className="grid gap-x-8 gap-y-5 2xl:grid-cols-2">
            {posts.map((post) => (
              <PlatformCopy key={post.platform} post={post} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** One platform's parts to copy, each with its own button. */
function PlatformCopy({ post }: { post: CaptionsPost }) {
  const t = useTranslations();
  const platform = t(`content.platform.${post.platform}`);
  const nothing = !post.caption && !post.hashtags && !post.pinnedComment;
  return (
    <section
      aria-label={platform}
      className="flex min-w-0 flex-col gap-4 border-t border-border pt-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{platform}</h3>
        {post.changed ? <SinceReviewBadge /> : null}
      </div>
      {nothing ? (
        <p className="text-[13px] text-muted-foreground">
          {t("contentEditor.captions.noCaption")}
        </p>
      ) : (
        <>
          <CopyField
            label={t("contentEditor.captions.caption")}
            text={post.caption}
            empty={t("contentEditor.captions.noCaption")}
            copyLabel={t("contentEditor.captions.copyCaption", { platform })}
          >
            <CaptionCount post={post} />
          </CopyField>
          {post.hashtags ? (
            <CopyField
              label={t("contentEditor.captions.hashtags")}
              text={post.hashtags}
              copyLabel={t("contentEditor.captions.copyHashtags", {
                platform,
              })}
            />
          ) : null}
          {post.pinnedComment ? (
            <CopyField
              label={t("contentEditor.captions.pinnedComment")}
              text={post.pinnedComment}
              copyLabel={t("contentEditor.captions.copyPinned", { platform })}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function CopyField({
  label,
  text,
  view,
  empty,
  copyLabel,
  badge,
  children,
}: {
  label: string;
  text: string;
  /** How the text reads, when it's more than plain text. */
  view?: React.ReactNode;
  /** Shown instead of the text when there's none. */
  empty?: string;
  copyLabel: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-xs text-muted-foreground">{label}</h4>
          {badge}
        </div>
        {text ? <CopyButton text={text} label={copyLabel} /> : null}
      </div>
      {text ? (
        (view ?? (
          <p className="max-w-prose text-sm break-words whitespace-pre-wrap">
            {text}
          </p>
        ))
      ) : (
        <p className="text-[13px] text-muted-foreground">{empty}</p>
      )}
      {children}
    </div>
  );
}

/** How long the post is with its hashtags, against the platform's limit when it has one. */
function CaptionCount({
  post,
}: {
  post: Pick<CaptionsPost, "platform" | "caption" | "hashtags">;
}) {
  const t = useTranslations();
  const count = characterCount(postText(post.caption, post.hashtags));
  const limit = CAPTION_LIMITS[post.platform];
  const over = limit !== undefined && count > limit;
  return (
    <p
      className={cn(
        "pl-1 text-xs tabular-nums",
        over ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {limit === undefined
        ? t("contentEditor.captions.count", { count })
        : over
          ? t("contentEditor.captions.overLimit", {
              count,
              limit,
              over: count - limit,
              platform: t(`content.platform.${post.platform}`),
            })
          : t("contentEditor.captions.countOfLimit", { count, limit })}
    </p>
  );
}

/** A platform's fields in the form. The count follows what you type. */
function PlatformFields({ post }: { post: CaptionsPost }) {
  const t = useTranslations();
  const platform = t(`content.platform.${post.platform}`);
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags);
  const id = (field: Parameters<typeof captionField>[0]) =>
    captionField(field, post.platform).replace(":", "-");
  return (
    <fieldset
      aria-labelledby={`${id("caption")}-platform`}
      className="flex min-w-0 flex-col gap-4 rounded-xl bg-muted/60 p-4"
    >
      <h3 id={`${id("caption")}-platform`} className="font-semibold">
        {platform}
      </h3>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("caption")}>
          {t("contentEditor.captions.caption")}
        </Label>
        <Textarea
          id={id("caption")}
          name={captionField("caption", post.platform)}
          rows={4}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          aria-describedby={`${id("caption")}-count`}
          className="bg-card"
        />
        <div id={`${id("caption")}-count`}>
          <CaptionCount post={{ platform: post.platform, caption, hashtags }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("hashtags")}>
          {t("contentEditor.captions.hashtags")}
        </Label>
        <Input
          id={id("hashtags")}
          name={captionField("hashtags", post.platform)}
          value={hashtags}
          onChange={(event) => setHashtags(event.target.value)}
          placeholder="#cyberskill"
          aria-describedby={`${id("hashtags")}-hint`}
          className="bg-card"
        />
        <p
          id={`${id("hashtags")}-hint`}
          className="pl-1 text-xs text-muted-foreground"
        >
          {t("contentEditor.captions.hashtagsHint")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("pinnedComment")}>
          {t("contentEditor.captions.pinnedComment")}
        </Label>
        <Textarea
          id={id("pinnedComment")}
          name={captionField("pinnedComment", post.platform)}
          rows={2}
          defaultValue={post.pinnedComment}
          aria-describedby={`${id("pinnedComment")}-hint`}
          className="bg-card"
        />
        <p
          id={`${id("pinnedComment")}-hint`}
          className="pl-1 text-xs text-muted-foreground"
        >
          {t("contentEditor.captions.pinnedCommentHint")}
        </p>
      </div>
    </fieldset>
  );
}
