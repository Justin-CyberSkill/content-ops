"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { ContentType } from "@/shared/db/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { StepRow, WorkTypeRow } from "../api/queries";
import { saveSteps, type WorkflowState } from "../api/workflow-actions";
import { DAYS_BEFORE_MAX } from "../model/work-type";

/**
 * One content type's steps: which kinds of work it needs, each due some days before
 * the publish day. Saves on request, since a change here shapes every idea approved after.
 */
export function StepsCard({
  contentType,
  workTypes,
  steps,
}: {
  contentType: ContentType;
  workTypes: WorkTypeRow[];
  steps: StepRow[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<WorkflowState, FormData>(
    saveSteps.bind(null, contentType),
    {},
  );
  const [dirty, setDirty] = useState(false);
  const [needed, setNeeded] = useState(
    () => new Set(steps.map((step) => step.workTypeId)),
  );
  const headingId = `steps-${contentType}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="font-semibold">
          {t(`content.type.${contentType}`)}
        </h3>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {t("workflow.stepCount", { count: needed.size })}
        </span>
      </div>
      <form
        // Submit by hand so React doesn't reset the form: a failed save keeps the ticks.
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setDirty(false);
          startTransition(() => action(formData));
        }}
        onChange={() => setDirty(true)}
        className="flex flex-col gap-4"
      >
        <ul className="flex flex-col gap-2">
          {workTypes.map((type) => {
            const step = steps.find((row) => row.workTypeId === type.id);
            const isNeeded = needed.has(type.id);
            const checkId = `step-${contentType}-${type.id}`;
            const daysId = `days-${contentType}-${type.id}`;
            return (
              <li
                key={type.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5"
              >
                <label
                  htmlFor={checkId}
                  className="flex min-h-9 min-w-0 cursor-pointer items-center gap-2.5 text-sm"
                >
                  <input
                    id={checkId}
                    type="checkbox"
                    name="work"
                    value={type.id}
                    checked={isNeeded}
                    onChange={(event) => {
                      const next = new Set(needed);
                      if (event.target.checked) next.add(type.id);
                      else next.delete(type.id);
                      setNeeded(next);
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-md bg-card text-transparent ring-[1.5px] ring-muted-foreground ring-inset peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:ring-0 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                  >
                    <CheckIcon className="size-3" strokeWidth={4} />
                  </span>
                  <span className="break-words">{type.name}</span>
                </label>
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Input
                    id={daysId}
                    name={`days:${type.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={DAYS_BEFORE_MAX}
                    required
                    defaultValue={step?.daysBefore ?? 0}
                    disabled={!isNeeded}
                    aria-label={t("workflow.daysBeforeOf", { work: type.name })}
                    className="h-9 w-18 text-center tabular-nums"
                  />
                  {t("workflow.daysBefore")}
                </span>
              </li>
            );
          })}
        </ul>
        {state.error ? (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending || !dirty}>
            {pending ? t("common.saving") : t("workflow.saveSteps")}
          </Button>
          {state.saved && !dirty && !pending ? (
            <span
              role="status"
              className="inline-flex items-center gap-1 text-[13px] text-success"
            >
              <CheckIcon aria-hidden="true" className="size-3.5" />
              {t("workflow.saved")}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
