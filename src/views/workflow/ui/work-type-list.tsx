"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useState,
  useTransition,
} from "react";
import { IDEA_STATUSES_WHILE_OPEN } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import type { WorkTypeRow } from "../api/queries";
import {
  addWorkType,
  deleteWorkType,
  moveWorkType,
  updateWorkType,
  type WorkflowState,
} from "../api/workflow-actions";
import { WORK_TYPE_NAME_MAX } from "../model/work-type";
import { PeoplePicker } from "./people-picker";

type Member = { id: string; name: string };

/** Names shown in a row before the rest become "+N more". */
const NAMES_SHOWN = 3;

/**
 * The kinds of work in the order they happen. Each row reads at a glance: its name,
 * what the idea shows as, and who does it. One opens to edit at a time, and adding
 * one opens the same form at the end, so the list stays short to scan.
 */
export function WorkTypeList({
  workTypes,
  members,
}: {
  workTypes: WorkTypeRow[];
  members: Member[];
}) {
  const t = useTranslations("workflow");
  // The row being edited, "new" while adding, or null.
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {workTypes.length ? (
        <ol className="flex flex-col">
          {workTypes.map((type, index) => (
            <li
              key={type.id}
              className="flex gap-3 px-3 py-4 [&+&]:border-t [&+&]:border-border"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {open === type.id ? (
                  <WorkTypeForm
                    type={type}
                    members={members}
                    onDone={() => setOpen(null)}
                  />
                ) : (
                  <WorkTypeRowView
                    type={type}
                    members={members}
                    first={index === 0}
                    last={index === workTypes.length - 1}
                    onEdit={() => setOpen(type.id)}
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-3 py-4 text-muted-foreground">{t("noWorkTypes")}</p>
      )}
      <div className="border-t border-border px-3 pt-4 pb-2">
        {open === "new" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-semibold">{t("addWorkType")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("addWorkTypeHint")}
              </p>
            </div>
            <WorkTypeForm members={members} onDone={() => setOpen(null)} />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen("new")}
          >
            <PlusIcon aria-hidden="true" />
            {t("addWorkType")}
          </Button>
        )}
      </div>
    </div>
  );
}

function WorkTypeRowView({
  type,
  members,
  first,
  last,
  onEdit,
}: {
  type: WorkTypeRow;
  members: Member[];
  first: boolean;
  last: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations();
  const [error, setError] = useState<string>();
  const [pending, startMove] = useTransition();
  const doers = members.filter((member) => type.doerIds.includes(member.id));
  const move = (direction: "up" | "down") =>
    startMove(async () => {
      setError(undefined);
      const result = await moveWorkType(type.id, direction);
      if (result.error) setError(result.error);
    });
  const names = doers
    .slice(0, NAMES_SHOWN)
    .map((doer) => doer.name)
    .join(", ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-semibold break-words">{type.name}</h3>
          <p className="text-sm text-muted-foreground">
            {t("workflow.ideaShowsAs", {
              status: t(`content.status.${type.ideaStatus}`),
            })}
          </p>
          <p
            className={cn(
              "flex items-start gap-1.5 text-sm",
              doers.length ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <UsersIcon
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            />
            <span>
              <span className="sr-only">{t("workflow.whoDoesIt")}: </span>
              {doers.length
                ? doers.length > NAMES_SHOWN
                  ? `${names} ${t("workflow.moreDoers", { count: doers.length - NAMES_SHOWN })}`
                  : names
                : t("workflow.noDoers")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("workflow.moveUp", { work: type.name })}
            disabled={first || pending}
            onClick={() => move("up")}
          >
            <ArrowUpIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("workflow.moveDown", { work: type.name })}
            disabled={last || pending}
            onClick={() => move("down")}
          >
            <ArrowDownIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t("workflow.edit", { work: type.name })}
            onClick={onEdit}
          >
            <PencilIcon aria-hidden="true" />
            {t("workflow.editShort")}
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Adds a kind of work, or edits one: its name, what the idea shows as, and who does it. */
function WorkTypeForm({
  type,
  members,
  onDone,
}: {
  /** Left out when adding. */
  type?: WorkTypeRow;
  members: Member[];
  onDone: () => void;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<WorkflowState, FormData>(
    async (prev, formData) => {
      const result = type
        ? await updateWorkType(type.id, prev, formData)
        : await addWorkType(prev, formData);
      if (result.saved) onDone();
      return result;
    },
    {},
  );
  const [deleting, startDelete] = useTransition();
  const key = type?.id ?? "new";
  const nameId = `work-name-${key}`;
  const statusId = `work-status-${key}`;
  return (
    <form
      // Submit by hand so React doesn't reset the form: a failed save keeps the picks.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={nameId}>{t("workflow.name")}</Label>
          <Input
            id={nameId}
            name="name"
            defaultValue={type?.name}
            placeholder={type ? undefined : t("workflow.namePlaceholder")}
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
            defaultValue={type?.ideaStatus ?? "in_progress"}
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
      <p className="-mt-2 pl-1 text-xs text-muted-foreground">
        {t("workflow.ideaStatusHint")}
      </p>
      <PeoplePicker members={members} defaultPicked={type?.doerIds ?? []} />
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {type ? (
          // Rare and permanent, so it stays small, away from Save, and asks first.
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (
                !window.confirm(
                  t("workflow.confirmDelete", { work: type.name }),
                )
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
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? t("common.saving")
              : type
                ? t("workflow.save")
                : t("workflow.add")}
          </Button>
        </div>
      </div>
    </form>
  );
}
