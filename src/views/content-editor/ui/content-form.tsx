"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { type ContentOrigin, originHref } from "@/entities/content";
import { DueDay, dueDate } from "@/entities/task";
import type { WorkPlan } from "@/entities/task/index.server";
import {
  CONTENT_TYPES,
  type ContentType,
  PLAN_STATUSES,
  PLATFORMS,
} from "@/shared/db/schema";
import { Link } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import type { Member } from "../api/queries";
import { type SaveContentState, saveContent } from "../api/save-content";
import type { AssignmentValues } from "../model/assignments";
import type { ContentFormValues } from "../model/content-form";
import { WhoDoesWhat } from "./who-does-what";

/** A task as the edit form lists it: its due day moves with the publish day. */
export type FormTask = {
  id: string;
  name: string;
  daysBefore: number;
  assigneeName: string | null;
  done: boolean;
};

type Props = {
  id: string | null;
  /** The list the item was opened from; cancelling and saving go back there. */
  from: ContentOrigin;
  initial: ContentFormValues;
  members: Member[];
  /** Reviewing an agent's proposal: saving approves it. */
  approving?: boolean;
  /** The proposal's version when the form opened, so saving can tell if an agent changed it since. */
  revision?: number;
  /** Set when the form opens inside another view: Cancel closes it instead of leaving. */
  onCancel?: () => void;
  /**
   * Each content type's steps. A new or approved item of a type with steps gets tasks,
   * so the form asks who does what instead of a status and owner.
   */
  plan?: WorkPlan;
  /** The item's tasks, when it has them: its status and owner follow them. */
  tasks?: FormTask[];
  /** Today in the team's zone, for due days. */
  today?: string;
  /** Who's picked per step, when the picks live outside the form. */
  picked?: AssignmentValues;
  onPick?: (stepId: string, assigneeId: string) => void;
  /** Admins get a link to set up who does each kind of work. */
  canSetUp?: boolean;
};

export function ContentForm({
  id,
  from,
  initial: values,
  members,
  approving,
  revision,
  onCancel,
  plan,
  tasks,
  today = "",
  picked: outsidePicks,
  onPick: onOutsidePick,
  canSetUp = false,
}: Props) {
  const [state, action, pending] = useActionState<SaveContentState, FormData>(
    saveContent.bind(null, id),
    {},
  );
  const t = useTranslations();
  // The type decides the steps and the publish day decides due days, so both are watched.
  const [type, setType] = useState(values.type);
  const [publishDate, setPublishDate] = useState(values.publishDate);
  const [ownPicks, setOwnPicks] = useState<AssignmentValues>({});
  const picked = outsidePicks ?? ownPicks;
  const pick =
    onOutsidePick ??
    ((stepId: string, assigneeId: string) =>
      setOwnPicks((current) => ({ ...current, [stepId]: assigneeId })));
  const steps = plan?.[type as ContentType] ?? [];
  // A failed save names the field it's about: say so there, and move focus to it.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.field) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${state.field}"]`)
      ?.focus({ preventScroll: true });
    // Platforms are visually hidden checkboxes, so scroll to the message, not the input.
    document
      .getElementById(`${state.field}-error`)
      ?.scrollIntoView({ block: "center" });
  }, [state]);
  const errorFor = (field: keyof ContentFormValues) =>
    state.field === field ? state.error : undefined;
  const invalid = (field: keyof ContentFormValues) =>
    state.field === field
      ? { "aria-invalid": true, "aria-describedby": `${field}-error` }
      : {};
  const side = tasks?.length
    ? "tasks"
    : (id === null || approving) && steps.length
      ? "plan"
      : "status";

  return (
    <form
      ref={formRef}
      // Submit by hand so React doesn't reset the form: a failed save keeps what was typed.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      // One column on narrow screens, in the order people fill it: brief, format, schedule,
      // links, status and owner, then save. From xl, status and owner move to a side column.
      // A flex column below xl, so the phone save bar can stick across the whole form.
      className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] xl:items-start"
    >
      <input type="hidden" name="from" value={from} />
      {approving ? (
        <input type="hidden" name="revision" value={revision ?? 0} />
      ) : null}
      <div className="flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-span-2 xl:row-start-1">
        <Section title={t("contentEditor.brief")}>
          <Field
            label={t("contentEditor.goal")}
            htmlFor="goal"
            hint={`${t("contentEditor.goalHint")} ${t("contentEditor.markdownHint")}`}
            error={errorFor("goal")}
          >
            <Textarea
              id="goal"
              name="goal"
              rows={2}
              defaultValue={values.goal}
              required
              {...invalid("goal")}
            />
          </Field>
          <Field
            label={t("contentEditor.idea")}
            htmlFor="idea"
            error={errorFor("idea")}
          >
            <Textarea
              id="idea"
              name="idea"
              rows={4}
              defaultValue={values.idea}
              required
              {...invalid("idea")}
            />
          </Field>
        </Section>

        <div className="flex flex-wrap gap-6">
          <Section
            title={t("contentEditor.format")}
            className="flex-[3_1_20rem]"
          >
            <fieldset className="flex flex-col" {...invalid("platforms")}>
              <legend className="mb-2.5 pl-1 text-[13px] font-medium">
                {t("contentEditor.platforms")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="group flex h-10 cursor-pointer items-center gap-2 rounded-full bg-muted pr-4 pl-2.5 text-[13px] font-medium transition-colors hover:bg-muted-strong has-checked:bg-foreground has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
                  >
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      defaultChecked={values.platforms.includes(platform)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full bg-card text-transparent ring-[1.5px] ring-muted-foreground ring-inset peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-0"
                    >
                      <CheckIcon className="size-3" strokeWidth={4} />
                    </span>
                    {t(`content.platform.${platform}`)}
                  </label>
                ))}
              </div>
              <FieldError id="platforms-error" error={errorFor("platforms")} />
            </fieldset>
            <Field
              label={t("contentEditor.contentType")}
              htmlFor="type"
              error={errorFor("type")}
            >
              <NativeSelect
                id="type"
                name="type"
                defaultValue={values.type}
                onChange={(event) => setType(event.target.value)}
                className="w-full"
                required
                {...invalid("type")}
              >
                <NativeSelectOption value="" disabled>
                  {t("contentEditor.pickType")}
                </NativeSelectOption>
                {CONTENT_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {t(`content.type.${type}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </Section>

          <Section
            title={t("contentEditor.schedule")}
            className="flex-[2_1_16rem]"
          >
            <Field
              label={t("contentEditor.publishDay")}
              htmlFor="publishDate"
              optional
              error={errorFor("publishDate")}
            >
              <Input
                id="publishDate"
                name="publishDate"
                type="date"
                defaultValue={values.publishDate}
                onChange={(event) => setPublishDate(event.target.value)}
                className="tabular-nums"
                {...invalid("publishDate")}
              />
            </Field>
            <Field
              label={t("contentEditor.goldenTime")}
              htmlFor="goldenTime"
              hint={t("contentEditor.goldenTimeHint")}
              optional
              error={errorFor("goldenTime")}
            >
              <Input
                id="goldenTime"
                name="goldenTime"
                type="time"
                defaultValue={values.goldenTime}
                className="tabular-nums"
                {...invalid("goldenTime")}
              />
            </Field>
          </Section>
        </div>

        <Section title={t("contentEditor.referenceLinks")}>
          <Field
            label={t("contentEditor.links")}
            htmlFor="assetLinks"
            hint={t("contentEditor.linksHint")}
            optional
            error={errorFor("assetLinks")}
          >
            <Textarea
              id="assetLinks"
              name="assetLinks"
              rows={3}
              defaultValue={values.assetLinks}
              placeholder="https://drive.google.com/…"
              {...invalid("assetLinks")}
            />
          </Field>
        </Section>
      </div>

      {/* On narrow screens an existing item without tasks opens on status and owner, the fields people change most. */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-start-1",
          id && side === "status" && "max-xl:order-first",
        )}
      >
        {side === "tasks" ? (
          <Section title={t("contentEditor.tasks.title")}>
            {/* Status and owner follow the tasks; the server ignores these. */}
            <input type="hidden" name="status" value={values.status} />
            <p className="-mt-2 text-[13px] text-muted-foreground">
              {t("contentEditor.tasks.formHint")}
            </p>
            <ol className="flex flex-col gap-3">
              {tasks?.map((task) => (
                <li key={task.id} className="flex flex-col gap-0.5 pl-1">
                  <span className="text-[13px] font-medium">{task.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {task.assigneeName ?? t("common.unassigned")}
                    {publishDate ? (
                      <>
                        {" · "}
                        <DueDay
                          dueDate={dueDate(publishDate, task.daysBefore)}
                          today={today}
                          done={task.done}
                        />
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        ) : side === "plan" ? (
          <Section title={t("contentEditor.proposal.whoDoesWhat")}>
            {/* It starts as planned; the tasks move it on from there. */}
            <input type="hidden" name="status" value="planned" />
            <p className="-mt-2 text-[13px] text-muted-foreground">
              {t("contentEditor.proposal.whoDoesWhatHint")}
            </p>
            <WhoDoesWhat
              steps={steps}
              members={members}
              publishDate={publishDate}
              today={today}
              picked={picked}
              onPick={pick}
              canSetUp={canSetUp}
            />
          </Section>
        ) : (
          <Section title={t("contentEditor.statusAndOwner")}>
            {approving ? (
              // Approving always starts it as planned; a status picker here would contradict the badge.
              <div className="flex flex-col gap-2">
                <input type="hidden" name="status" value="planned" />
                <span className="pl-1 text-[13px] leading-none font-medium">
                  {t("contentEditor.status")}
                </span>
                <p className="pl-1 text-sm text-muted-foreground">
                  {t("contentEditor.proposal.approvedAs", {
                    status: t("content.status.planned"),
                  })}
                </p>
              </div>
            ) : (
              <Field label={t("contentEditor.status")} htmlFor="status">
                <NativeSelect
                  id="status"
                  name="status"
                  defaultValue={values.status}
                  className="w-full"
                >
                  {PLAN_STATUSES.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {t(`content.status.${status}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field
              label={t("contentEditor.assignee")}
              htmlFor="assigneeId"
              error={errorFor("assigneeId")}
            >
              <NativeSelect
                id="assigneeId"
                name="assigneeId"
                defaultValue={values.assigneeId}
                className="w-full"
                {...invalid("assigneeId")}
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
            </Field>
          </Section>
        )}
      </div>

      {/* On phones the error and buttons stay above the bottom navigation while the form scrolls. */}
      <div className="sticky bottom-(--bottom-nav,0px) z-10 -mx-4 flex min-w-0 flex-col gap-3 bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:gap-6 md:bg-transparent md:p-0 md:backdrop-blur-none xl:col-start-1 xl:row-start-3">
        {state.error && !state.field ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive-soft px-5 py-3.5 text-foreground"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
          ) : (
            <Link
              href={originHref(from)}
              className={buttonVariants({ variant: "ghost" })}
            >
              {t("common.cancel")}
            </Link>
          )}
          <Button type="submit" disabled={pending}>
            {pending
              ? t("common.saving")
              : approving
                ? t("contentEditor.proposal.saveAndApprove")
                : id
                  ? t("contentEditor.saveChanges")
                  : t("contentEditor.addToPlan")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  optional = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  /** Says so on the label, so people know what they can skip. */
  optional?: boolean;
  /** Why the last save failed, when it was this field. */
  error?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground">
            {t("optional")}
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p className="pl-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <FieldError id={`${htmlFor}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p
      id={id}
      role="alert"
      className="pl-1 text-xs font-medium text-destructive"
    >
      {error}
    </p>
  );
}
