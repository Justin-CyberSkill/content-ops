"use client";

import {
  CheckIcon,
  ListChecksIcon,
  MessageSquareWarningIcon,
  PencilIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";
import type { ContentOrigin } from "@/entities/content";
import { DueDay, type TaskKind, TaskStatusBadge } from "@/entities/task";
import type { PlannedStep } from "@/entities/task/index.server";
import { TaskAssigneeSelect, TaskStatusSelect } from "@/features/task-progress";
import { PLAN_STATUSES, type TaskStatus } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import type { Member } from "../api/queries";
import { type StartTasksState, startTasks } from "../api/start-tasks";
import { type ProgressState, updateProgress } from "../api/update-progress";
import type { AssignmentValues } from "../model/assignments";
import type { ContentFormValues } from "../model/content-form";
import { ContentForm, type FormTask } from "./content-form";
import { effectiveAssignments, WhoDoesWhat } from "./who-does-what";

/** A task as the item page shows it. */
export type PanelTask = {
  id: string;
  name: string;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  daysBefore: number;
  /** Members who do this kind of work, offered first when reassigning. */
  doers: { id: string; name: string }[];
  kind: TaskKind;
  /** What a review asked for when it sent this task back, until it's done again. The note is rendered on the server. */
  changesRequested: { note: React.ReactNode; by: string | null } | null;
};

/**
 * An item opens to read, not to edit: the details and what the tasks made on the left,
 * and on the right what people act on: the open review or the live links first, then
 * the tasks. For an item from before tasks, its status and assignee. The full form
 * opens from the details card and takes the whole width, one thing at a time.
 */
export function ContentView({
  id,
  from,
  initial,
  members,
  tasks,
  steps,
  me,
  today,
  summary,
  work,
  actions,
  comments,
  danger,
}: {
  id: string;
  from: ContentOrigin;
  initial: ContentFormValues;
  members: Member[];
  /** The item's tasks in order; empty for an item from before tasks. */
  tasks: PanelTask[];
  /** The steps its content type has now, for splitting an item without tasks. Admins only. */
  steps: PlannedStep[];
  me: { id: string; isAdmin: boolean };
  /** Today in the team's zone. */
  today: string;
  /** The read-only details, rendered on the server. */
  summary: React.ReactNode;
  /** What the tasks make: script and captions, assets, reviews. Under the details. */
  work?: React.ReactNode;
  /** The open review's decision or the live links, above the tasks: the page's main action. */
  actions?: React.ReactNode;
  comments: React.ReactNode;
  /** Admin-only delete, under the panel. */
  danger?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const t = useTranslations("contentEditor");
  const formTasks: FormTask[] = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    daysBefore: task.daysBefore,
    assigneeName: task.assigneeName,
    done: task.status === "done",
  }));

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
            tasks={formTasks}
            today={today}
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

  // One DOM order for every size (details, panel, work, comments), so on a phone the
  // next action and the tasks come right after the details, not after a long script.
  // From xl the panel moves to a right column that spans every row and stays in view;
  // the last row takes any spare height, so nothing leaves a gap under a tall panel.
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:grid-rows-[auto_auto_1fr] xl:items-start">
      {/* Edit sits on the card it changes, not on the tasks beside it. */}
      <div className="relative min-w-0 xl:col-start-1 xl:row-start-1">
        {summary}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="absolute top-5 right-5 md:top-6 md:right-6"
        >
          <PencilIcon aria-hidden="true" />
          {t("editDetails")}
        </Button>
      </div>
      <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-8 xl:col-start-2 xl:row-span-3 xl:row-start-1">
        {actions}
        {tasks.length ? (
          <TasksPanel tasks={tasks} members={members} me={me} today={today} />
        ) : (
          <ProgressPanel
            id={id}
            initial={initial}
            members={members}
            steps={me.isAdmin ? steps : []}
            today={today}
          />
        )}
        {danger}
      </div>
      <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-start-2">
        {work}
      </div>
      <div className="min-w-0 xl:col-start-1 xl:row-start-3">{comments}</div>
    </div>
  );
}

/**
 * The item's tasks in order, each with who has it, when it's due and where it stands.
 * Only the open task moves; the ones after it wait. Its assignee or an admin changes
 * its status, and admins can hand any task to someone else.
 */
function TasksPanel({
  tasks,
  members,
  me,
  today,
}: {
  tasks: PanelTask[];
  members: Member[];
  me: { id: string; isAdmin: boolean };
  today: string;
}) {
  const t = useTranslations();
  const done = tasks.filter((task) => task.status === "done").length;
  return (
    <section
      aria-labelledby="tasks-heading"
      className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tasks-heading" className="text-lg font-semibold">
          {t("contentEditor.tasks.title")}
        </h2>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {t("contentEditor.tasks.doneCount", { done, total: tasks.length })}
        </span>
      </div>
      <ol className="flex flex-col">
        {tasks.map((task, index) => {
          // An open review is decided with Approve or Request changes, not a status.
          const canChange =
            (me.isAdmin || task.assigneeId === me.id) &&
            task.status !== "waiting" &&
            !(task.kind === "review" && task.status !== "done");
          return (
            <li
              key={task.id}
              className="flex gap-3 py-3.5 [&+&]:border-t [&+&]:border-border"
            >
              <StepMarker status={task.status} number={index + 1} />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold break-words">
                      {task.name}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {me.isAdmin ? null : (
                        <>
                          {task.assigneeName ?? t("common.unassigned")}
                          {task.dueDate ? " · " : null}
                        </>
                      )}
                      <DueDay
                        dueDate={task.dueDate}
                        today={today}
                        done={task.status === "done"}
                      />
                    </span>
                  </div>
                  {canChange && task.status !== "waiting" ? (
                    <TaskStatusSelect
                      // A refresh with a new status resets the pill.
                      key={task.status}
                      taskId={task.id}
                      status={task.status}
                      label={t("task.statusOf", { task: task.name })}
                    />
                  ) : (
                    <TaskStatusBadge status={task.status} />
                  )}
                </div>
                {task.changesRequested ? (
                  <ChangesRequested {...task.changesRequested} />
                ) : null}
                {me.isAdmin ? (
                  <TaskAssigneeSelect
                    key={task.assigneeId ?? ""}
                    taskId={task.id}
                    assigneeId={task.assigneeId}
                    doers={task.doers}
                    members={members}
                    label={t("task.assigneeOf", { task: task.name })}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-[13px] text-muted-foreground">
        {t("contentEditor.tasks.panelHint")}
      </p>
    </section>
  );
}

/** What the reviewer asked for, on the task they sent back. */
function ChangesRequested({
  note,
  by,
}: {
  note: React.ReactNode;
  by: string | null;
}) {
  const t = useTranslations("contentEditor.tasks");
  return (
    <div className="flex gap-2.5 rounded-xl bg-status-in-review-bg px-3.5 py-3 text-sm">
      <MessageSquareWarningIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-status-in-review"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold text-status-in-review">
          {by ? t("changesRequestedBy", { name: by }) : t("changesRequested")}
        </span>
        {note}
      </div>
    </div>
  );
}

/** The step's number in a circle: a check when done, filled while it's the open one. */
function StepMarker({
  status,
  number,
}: {
  status: TaskStatus;
  number: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        status === "done"
          ? "bg-status-published-bg text-status-published"
          : status === "waiting"
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground",
      )}
    >
      {status === "done" ? (
        <CheckIcon className="size-3.5" strokeWidth={3} />
      ) : (
        number
      )}
    </span>
  );
}

function ProgressPanel({
  id,
  initial,
  members,
  steps,
  today,
}: {
  id: string;
  initial: ContentFormValues;
  members: Member[];
  /** Its content type's steps, when an admin can split it into tasks. */
  steps: PlannedStep[];
  today: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ProgressState, FormData>(
    updateProgress.bind(null, id),
    {},
  );
  const [dirty, setDirty] = useState(false);
  const [splitting, setSplitting] = useState(false);

  if (splitting)
    return (
      <SplitIntoTasks
        id={id}
        steps={steps}
        members={members}
        publishDate={initial.publishDate}
        today={today}
        onCancel={() => setSplitting(false)}
      />
    );

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
      {steps.length ? (
        // Items from before tasks: an admin can move them onto the workflow.
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSplitting(true)}
          >
            <ListChecksIcon aria-hidden="true" />
            {t("contentEditor.tasks.split")}
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">
            {t("contentEditor.tasks.splitHint")}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function SplitIntoTasks({
  id,
  steps,
  members,
  publishDate,
  today,
  onCancel,
}: {
  id: string;
  steps: PlannedStep[];
  members: Member[];
  publishDate: string;
  today: string;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [picked, setPicked] = useState<AssignmentValues>({});
  const [state, setState] = useState<StartTasksState>({});
  const [pending, startTransition] = useTransition();
  return (
    <section
      aria-labelledby="split-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="split-heading" className="text-lg font-semibold">
          {t("contentEditor.tasks.splitTitle")}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {t("contentEditor.tasks.splitFormHint")}
        </p>
      </div>
      <WhoDoesWhat
        steps={steps}
        members={members}
        publishDate={publishDate}
        today={today}
        picked={picked}
        onPick={(stepId, assigneeId) =>
          setPicked((current) => ({ ...current, [stepId]: assigneeId }))
        }
        canSetUp
      />
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(
                await startTasks(id, effectiveAssignments(steps, picked)),
              );
            })
          }
        >
          {pending
            ? t("contentEditor.tasks.splitting")
            : t("contentEditor.tasks.splitConfirm")}
        </Button>
      </div>
    </section>
  );
}
