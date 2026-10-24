"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { IDEA_STATUSES_WHILE_OPEN } from "@/shared/db/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { addWorkType, type WorkflowState } from "../api/workflow-actions";
import { WORK_TYPE_NAME_MAX } from "../model/work-type";

export function AddWorkTypeForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<WorkflowState, FormData>(
    addWorkType,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-work-name">{t("workflow.name")}</Label>
        <Input
          id="new-work-name"
          name="name"
          maxLength={WORK_TYPE_NAME_MAX}
          placeholder={t("workflow.namePlaceholder")}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-work-status">{t("workflow.ideaStatus")}</Label>
        <NativeSelect
          id="new-work-status"
          name="ideaStatus"
          defaultValue="in_progress"
          className="w-full"
        >
          {IDEA_STATUSES_WHILE_OPEN.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {t(`content.status.${status}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="pl-1 text-xs text-muted-foreground">
          {t("workflow.ideaStatusHint")}
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("workflow.adding") : t("workflow.add")}
      </Button>
    </form>
  );
}
