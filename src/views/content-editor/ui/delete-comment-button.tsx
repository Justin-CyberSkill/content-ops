"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { deleteComment } from "../api/comments";

export function DeleteCommentButton({
  id,
  authorName,
}: {
  id: string;
  authorName: string;
}) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("contentEditor.comments");
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-destructive"
      aria-label={t("delete", { name: authorName })}
      disabled={pending}
      onClick={() => {
        if (!confirm(t("confirmDelete"))) return;
        startTransition(async () => {
          await deleteComment(id);
        });
      }}
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  );
}
