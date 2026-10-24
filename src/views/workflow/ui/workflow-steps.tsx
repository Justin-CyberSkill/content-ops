"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CONTENT_TYPES, type ContentType } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import type { StepRow, WorkTypeRow } from "../api/queries";
import { StepsCard } from "./steps-card";

/**
 * One content type's steps at a time. The list on the side (a picker on phones) shows
 * every type with its step count, so gaps stand out without opening each one. Cards
 * stay mounted while hidden, so switching types keeps unsaved ticks, and the list
 * marks which ones have them.
 */
export function WorkflowSteps({
  workTypes,
  steps,
}: {
  workTypes: WorkTypeRow[];
  steps: StepRow[];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState<ContentType>(CONTENT_TYPES[0]);
  const [unsaved, setUnsaved] = useState<ReadonlySet<ContentType>>(new Set());
  // One callback per type, made once, so the cards' effects don't refire every render.
  const [onDirty] = useState(
    () =>
      Object.fromEntries(
        CONTENT_TYPES.map((contentType) => [
          contentType,
          (dirty: boolean) =>
            setUnsaved((current) => {
              if (current.has(contentType) === dirty) return current;
              const next = new Set(current);
              if (dirty) next.add(contentType);
              else next.delete(contentType);
              return next;
            }),
        ]),
      ) as Record<ContentType, (dirty: boolean) => void>,
  );
  const stepsOf = (contentType: ContentType) =>
    steps.filter((step) => step.contentType === contentType);
  const summary = (contentType: ContentType) =>
    [
      t("workflow.stepCount", { count: stepsOf(contentType).length }),
      unsaved.has(contentType) ? t("workflow.unsaved") : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-2 lg:hidden">
        <Label htmlFor="steps-content-type">
          {t("contentEditor.contentType")}
        </Label>
        <NativeSelect
          id="steps-content-type"
          value={open}
          onChange={(event) => setOpen(event.target.value as ContentType)}
          className="w-full bg-card"
        >
          {CONTENT_TYPES.map((contentType) => (
            <NativeSelectOption key={contentType} value={contentType}>
              {`${t(`content.type.${contentType}`)} · ${summary(contentType)}`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <nav
        aria-label={t("contentEditor.contentType")}
        className="hidden rounded-2xl bg-card p-2 shadow-card lg:sticky lg:top-8 lg:block"
      >
        <ul className="flex flex-col gap-0.5">
          {CONTENT_TYPES.map((contentType) => {
            const current = contentType === open;
            return (
              <li key={contentType}>
                <button
                  type="button"
                  aria-current={current ? "true" : undefined}
                  onClick={() => setOpen(contentType)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    current
                      ? "bg-foreground text-background"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-semibold">
                    {t(`content.type.${contentType}`)}
                  </span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      current ? "text-background/80" : "text-muted-foreground",
                    )}
                  >
                    {summary(contentType)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {CONTENT_TYPES.map((contentType) => (
        <StepsCard
          key={contentType}
          contentType={contentType}
          workTypes={workTypes}
          steps={stepsOf(contentType)}
          hidden={contentType !== open}
          onDirtyChange={onDirty[contentType]}
        />
      ))}
    </div>
  );
}
