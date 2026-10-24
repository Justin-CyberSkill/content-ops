"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { cn } from "@/shared/lib";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/shared/ui/native-select";
import { changeTaskAssignee } from "../api/change-task";

type Person = { id: string; name: string };

/**
 * Who has a task, changed in place by an admin. People who do this kind of work come
 * first; everyone else is under Others, for when the usual person is away.
 */
export function TaskAssigneeSelect({
  taskId,
  assigneeId,
  doers,
  members,
  label,
  className,
}: {
  taskId: string;
  assigneeId: string | null;
  /** Members who do this task's work type. */
  doers: Person[];
  members: Person[];
  /** Names the task, such as "Assignee for Content prep". */
  label: string;
  className?: string;
}) {
  const [value, setValue] = useState(assigneeId ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const t = useTranslations();
  const doerIds = new Set(doers.map((person) => person.id));
  const others = members.filter((person) => !doerIds.has(person.id));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <NativeSelect
        size="sm"
        className="w-full"
        aria-label={label}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const result = await changeTaskAssignee(taskId, next);
            if (result.error) {
              setValue(assigneeId ?? "");
              setError(result.error);
            }
          });
        }}
      >
        <NativeSelectOption value="">
          {t("common.unassigned")}
        </NativeSelectOption>
        {doers.map((person) => (
          <NativeSelectOption key={person.id} value={person.id}>
            {person.name}
          </NativeSelectOption>
        ))}
        {others.length ? (
          <NativeSelectOptGroup label={t("task.others")}>
            {others.map((person) => (
              <NativeSelectOption key={person.id} value={person.id}>
                {person.name}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        ) : null}
      </NativeSelect>
      {error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
