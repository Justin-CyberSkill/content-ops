"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { taskStatusColorClasses } from "@/entities/task";
import type { TaskStatus } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { changeTaskStatus } from "../api/change-task";

const CHOICES = ["todo", "in_progress", "done"] as const;

/**
 * A task's status as a coloured pill you change in place. Waiting tasks can't be
 * changed, so callers show a badge for those instead.
 */
export function TaskStatusSelect({
  taskId,
  status,
  label,
}: {
  taskId: string;
  status: Exclude<TaskStatus, "waiting">;
  /** Names the task, such as "Status of Content prep". */
  label: string;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("task.status");

  return (
    <div className="flex flex-col items-end gap-1">
      <NativeSelect
        size="sm"
        className={cn("rounded-full", taskStatusColorClasses[value])}
        selectClassName="bg-transparent font-semibold inset-shadow-none"
        aria-label={label}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as (typeof CHOICES)[number];
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const result = await changeTaskStatus(taskId, next);
            if (result.error) {
              setValue(status);
              setError(result.error);
            }
          });
        }}
      >
        {CHOICES.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {t(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error ? (
        <p role="alert" className="text-right text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
