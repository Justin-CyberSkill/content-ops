"use client";

import { SendHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { addComment } from "../api/comments";
import { COMMENT_MAX_LENGTH } from "../model/comment";

export function CommentComposer({ contentId }: { contentId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("contentEditor");

  function send() {
    if (pending || !body.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const result = await addComment(contentId, body);
      if (result.error) setError(result.error);
      else setBody("");
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="comment-body" className="sr-only">
        {t("comments.label")}
      </label>
      <Textarea
        id="comment-body"
        rows={2}
        value={body}
        placeholder={t("comments.placeholder")}
        maxLength={COMMENT_MAX_LENGTH}
        aria-describedby="comment-hint"
        aria-invalid={error ? true : undefined}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            send();
          }
        }}
      />
      {error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="comment-hint" className="pl-1 text-xs text-muted-foreground">
          {t("markdownHint")} {t("comments.hint")}
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={pending || !body.trim()}
          className="ml-auto"
        >
          <SendHorizontalIcon aria-hidden="true" />
          {pending ? t("comments.sending") : t("comments.send")}
        </Button>
      </div>
    </form>
  );
}
