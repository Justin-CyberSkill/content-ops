"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useOptimistic, useState, useTransition } from "react";
import { IDEA_STATUSES_WHILE_OPEN } from "@/shared/db/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import type { WorkTypeRow } from "../api/queries";
import {
  deleteWorkType,
  moveWorkType,
  setDoer,
  updateWorkType,
  type WorkflowState,
} from "../api/workflow-actions";
import { WORK_TYPE_NAME_MAX } from "../model/work-type";

type Member = { id: string; name: string };

/**
 * The kinds of work in the order they happen, each with who does it. Ticking a person
 * saves at once, since it's the change made most; renaming opens a small form.
 */
export function WorkTypeList({
  workTypes,
  members,
}: {
  workTypes: WorkTypeRow[];
  members: Member[];
}) {
  return (
    <ol className="flex flex-col">
      {workTypes.map((type, index) => (
        <WorkTypeItem
          key={type.id}
          type={type}
          number={index + 1}
          first={index === 0}
          last={index === workTypes.length - 1}
          members={members}
        />
      ))}
    </ol>
  );
}

function WorkTypeItem({
  type,
  number,
  first,
  last,
  members,
}: {
  type: WorkTypeRow;
  number: number;
  first: boolean;
  last: boolean;
  members: Member[];
}) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [doerIds, setDoerIds] = useOptimistic(type.doerIds);

  const run = (action: () => Promise<WorkflowState>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await action();
      if (result.error) setError(result.error);
    });

  return (
    <li className="flex gap-3 px-3 py-4 [&+&]:border-t [&+&]:border-border">
      <span
        aria-hidden="true"
        className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums"
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {editing ? (
          <EditWorkType type={type} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="font-semibold break-words">{type.name}</h3>
              <p className="text-[13px] text-muted-foreground">
                {t("workflow.ideaShowsAs", {
                  status: t(`content.status.${type.ideaStatus}`),
                })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("workflow.moveUp", { work: type.name })}
                disabled={first || pending}
                onClick={() => run(() => moveWorkType(type.id, "up"))}
              >
                <ArrowUpIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("workflow.moveDown", { work: type.name })}
                disabled={last || pending}
                onClick={() => run(() => moveWorkType(type.id, "down"))}
              >
                <ArrowDownIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("workflow.edit", { work: type.name })}
                onClick={() => setEditing(true)}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">
            {t("workflow.whoDoesIt")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const checked = doerIds.includes(member.id);
              return (
                <label
                  key={member.id}
                  className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-muted pr-3.5 pl-2 text-[13px] font-medium transition-colors hover:bg-muted-strong has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const does = event.target.checked;
                      startTransition(async () => {
                        setError(undefined);
                        setDoerIds(
                          does
                            ? [...doerIds, member.id]
                            : doerIds.filter((id) => id !== member.id),
                        );
                        const result = await setDoer(type.id, member.id, does);
                        if (result.error) setError(result.error);
                      });
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex size-5 items-center justify-center rounded-full bg-card text-transparent ring-[1.5px] ring-muted-foreground ring-inset peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-0"
                  >
                    <CheckIcon className="size-3" strokeWidth={4} />
                  </span>
                  {member.name}
                </label>
              );
            })}
          </div>
          {doerIds.length ? null : (
            <p className="text-xs text-muted-foreground">
              {t("workflow.noDoers")}
            </p>
          )}
        </fieldset>
        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function EditWorkType({
  type,
  onDone,
}: {
  type: WorkTypeRow;
  onDone: () => void;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<WorkflowState, FormData>(
    async (prev, formData) => {
      const result = await updateWorkType(type.id, prev, formData);
      if (result.saved) onDone();
      return result;
    },
    {},
  );
  const [deleting, startDelete] = useTransition();
  const nameId = `work-name-${type.id}`;
  const statusId = `work-status-${type.id}`;
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>{t("workflow.name")}</Label>
          <Input
            id={nameId}
            name="name"
            defaultValue={type.name}
            maxLength={WORK_TYPE_NAME_MAX}
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={statusId}>{t("workflow.ideaStatus")}</Label>
          <NativeSelect
            id={statusId}
            name="ideaStatus"
            defaultValue={type.ideaStatus}
            className="w-full"
          >
            {IDEA_STATUSES_WHILE_OPEN.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {t(`content.status.${status}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <p className="pl-1 text-xs text-muted-foreground">
        {t("workflow.ideaStatusHint")}
      </p>
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Rare and permanent, so it stays small and asks first. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={deleting}
          onClick={() => {
            if (
              !window.confirm(t("workflow.confirmDelete", { work: type.name }))
            )
              return;
            startDelete(async () => {
              await deleteWorkType(type.id);
            });
          }}
        >
          <Trash2Icon aria-hidden="true" />
          {deleting ? t("workflow.deleting") : t("workflow.delete")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t("common.saving") : t("workflow.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
