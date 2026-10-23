"use client";

import { PauseIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { deleteAgentKey, setAgentKeyEnabled } from "../api/manage-keys";

export function KeyActions({
  id,
  name,
  enabled,
}: {
  id: string;
  name: string;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const t = useTranslations("agents");
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        aria-label={t(enabled ? "disableLabel" : "enableLabel", { name })}
        onClick={() =>
          startTransition(async () => {
            await setAgentKeyEnabled(id, !enabled);
          })
        }
      >
        {enabled ? (
          <PauseIcon aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
        {enabled ? t("disable") : t("enable")}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        disabled={pending}
        aria-label={t("deleteLabel", { name })}
        onClick={() => {
          if (!confirm(t("confirmDelete", { name }))) return;
          startTransition(async () => {
            await deleteAgentKey(id);
          });
        }}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  );
}
