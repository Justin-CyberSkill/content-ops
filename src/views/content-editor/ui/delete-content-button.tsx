"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { ContentOrigin } from "@/entities/content";
import { Button } from "@/shared/ui/button";
import { deleteContent } from "../api/save-content";

export function DeleteContentButton({
  id,
  from,
}: {
  id: string;
  from: ContentOrigin;
}) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("contentEditor");
  return (
    <Button
      variant="destructive"
      size="sm"
      className="self-start"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("confirmDelete"))) return;
        startTransition(() => deleteContent(id, from));
      }}
    >
      <Trash2Icon aria-hidden="true" />
      {pending ? t("deleting") : t("deleteTitle")}
    </Button>
  );
}
