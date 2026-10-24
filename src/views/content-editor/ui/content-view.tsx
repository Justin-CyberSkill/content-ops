"use client";

import { CheckIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { ContentOrigin } from "@/entities/content";
import { PLAN_STATUSES } from "@/shared/db/schema";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import type { Member } from "../api/queries";
import { type ProgressState, updateProgress } from "../api/update-progress";
import type { ContentFormValues } from "../model/content-form";
import { ContentForm } from "./content-form";

/**
 * An item opens to read, not to edit: the details on the left, and on the right the
 * thing people change most, status and owner. The full form opens on request and
 * takes the whole width, one thing at a time.
 */
export function ContentView({
  id,
  from,
  initial,
  members,
  summary,
  comments,
  danger,
}: {
  id: string;
  from: ContentOrigin;
  initial: ContentFormValues;
  members: Member[];
  /** The read-only details, rendered on the server. */
  summary: React.ReactNode;
  comments: React.ReactNode;
  /** Admin-only delete, under the panel. */
  danger?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const t = useTranslations("contentEditor");

  if (editing) {
    return (
      <>
        <section aria-labelledby="edit-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="edit-heading" className="text-lg font-semibold">
              {t("editDetails")}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {t("editDetailsHint")}
            </p>
          </div>
          <ContentForm
            id={id}
            from={from}
            initial={initial}
            members={members}
            onCancel={() => setEditing(false)}
          />
        </section>
        {/* Same columns as the form, so the thread lines up under the brief. */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          {comments}
        </div>
      </>
    );
  }

  // One DOM order for every size (details, panel, comments); from xl the panel moves
  // to a right column that spans both rows and stays in view.
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
      <div className="min-w-0 xl:col-start-1 xl:row-start-1">{summary}</div>
      <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">
        <ProgressPanel
          id={id}
          initial={initial}
          members={members}
          onEdit={() => setEditing(true)}
        />
        {danger}
      </div>
      <div className="min-w-0 xl:col-start-1 xl:row-start-2">{comments}</div>
    </div>
  );
}

function ProgressPanel({
  id,
  initial,
  members,
  onEdit,
}: {
  id: string;
  initial: ContentFormValues;
  members: Member[];
  onEdit: () => void;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ProgressState, FormData>(
    updateProgress.bind(null, id),
    {},
  );
  const [dirty, setDirty] = useState(false);

  return (
    <section
      aria-labelledby="progress-heading"
      className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card"
    >
      <h2 id="progress-heading" className="text-lg font-semibold">
        {t("contentEditor.statusAndOwner")}
      </h2>
      <form
        // Fresh values after a save come back as new props; the key resets the fields.
        key={`${initial.status}-${initial.assigneeId}`}
        action={(formData) => {
          setDirty(false);
          action(formData);
        }}
        onChange={() => setDirty(true)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="progress-status">{t("contentEditor.status")}</Label>
          <NativeSelect
            id="progress-status"
            name="status"
            defaultValue={initial.status}
            className="w-full"
          >
            {PLAN_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {t(`content.status.${status}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="progress-assignee">
            {t("contentEditor.assignee")}
          </Label>
          <NativeSelect
            id="progress-assignee"
            name="assigneeId"
            defaultValue={initial.assigneeId}
            className="w-full"
          >
            <NativeSelectOption value="">
              {t("common.unassigned")}
            </NativeSelectOption>
            {members.map((member) => (
              <NativeSelectOption key={member.id} value={member.id}>
                {member.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {state.error ? (
          <p role="alert" className="pl-1 text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? t("common.saving") : t("contentEditor.saveProgress")}
          </Button>
          {state.saved && !dirty && !pending ? (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-[13px] text-success"
            >
              <CheckIcon aria-hidden="true" className="size-3.5" />
              {t("contentEditor.saved")}
            </span>
          ) : null}
        </div>
      </form>
      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <Button type="button" variant="outline" onClick={onEdit}>
          <PencilIcon aria-hidden="true" />
          {t("contentEditor.editDetails")}
        </Button>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("contentEditor.editDetailsHint")}
        </p>
      </div>
    </section>
  );
}
