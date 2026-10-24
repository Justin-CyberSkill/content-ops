"use client";

import { useTranslations } from "next-intl";
import { DueDay, dueDate } from "@/entities/task";
import type { PlannedStep } from "@/entities/task/index.server";
import { Link } from "@/shared/i18n";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";
import type { Member } from "../api/queries";
import { ASSIGNEE_FIELD, type AssignmentValues } from "../model/assignments";

/** Who takes each step: the picked person, or the suggestion until someone picks. */
export function effectiveAssignments(
  steps: PlannedStep[],
  picked: AssignmentValues,
): AssignmentValues {
  return Object.fromEntries(
    steps.map((step) => [step.id, picked[step.id] ?? step.suggestedId ?? ""]),
  );
}

/**
 * One row per step of the idea's workflow: who takes it, and when it's due. Each
 * starts on the suggested person: someone who does that work and has the fewest open
 * tasks. Inside a form, each select submits as `assignee:<step id>`.
 */
export function WhoDoesWhat({
  steps,
  members,
  publishDate,
  today,
  picked,
  onPick,
  canSetUp,
}: {
  steps: PlannedStep[];
  members: Member[];
  /** The publish day, or "" without one. */
  publishDate: string;
  today: string;
  picked: AssignmentValues;
  onPick: (stepId: string, assigneeId: string) => void;
  /** Admins get a link to set up who does each kind of work. */
  canSetUp: boolean;
}) {
  const t = useTranslations();
  const values = effectiveAssignments(steps, picked);
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step) => {
        const fieldId = `assign-${step.id}`;
        const doerIds = new Set(step.candidates.map((person) => person.id));
        const others = members.filter((member) => !doerIds.has(member.id));
        const due = publishDate
          ? null
          : step.daysBefore
            ? t("task.daysBefore", { count: step.daysBefore })
            : t("task.onPublishDay");
        return (
          <li key={step.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pl-1">
              <label htmlFor={fieldId} className="text-[13px] font-medium">
                {step.name}
              </label>
              <span className="text-xs text-muted-foreground">
                {due ?? (
                  <DueDay
                    dueDate={dueDate(publishDate, step.daysBefore)}
                    today={today}
                    done={false}
                  />
                )}
              </span>
            </div>
            <NativeSelect
              id={fieldId}
              name={`${ASSIGNEE_FIELD}${step.id}`}
              value={values[step.id]}
              onChange={(event) => onPick(step.id, event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="">
                {t("common.unassigned")}
              </NativeSelectOption>
              {step.candidates.map((person) => (
                <NativeSelectOption key={person.id} value={person.id}>
                  {t("task.candidate", {
                    name: person.name,
                    count: person.load,
                  })}
                </NativeSelectOption>
              ))}
              {others.length ? (
                <NativeSelectOptGroup label={t("task.others")}>
                  {others.map((member) => (
                    <NativeSelectOption key={member.id} value={member.id}>
                      {member.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelectOptGroup>
              ) : null}
            </NativeSelect>
            {step.candidates.length ? null : (
              <p className="pl-1 text-xs text-muted-foreground">
                {t("task.noDoers", { work: step.name })}{" "}
                {canSetUp ? (
                  <Link
                    href="/admin/workflow"
                    className="font-medium text-accent-foreground underline-offset-4 hover:underline"
                  >
                    {t("task.setUpDoers")}
                  </Link>
                ) : null}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
