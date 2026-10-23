"use client";

import { useState, useTransition } from "react";
import { statusLabels } from "@/entities/content";
import { CONTENT_STATUSES, type ContentStatus } from "@/shared/db/schema";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { updateTaskStatus } from "../api/update-status";

export function StatusSelect({
  id,
  status,
  label,
}: {
  id: string;
  status: ContentStatus;
  label: string;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <NativeSelect
        size="sm"
        aria-label={label}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as ContentStatus;
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const result = await updateTaskStatus(id, next);
            if (result.error) {
              setValue(status);
              setError(result.error);
            }
          });
        }}
      >
        {CONTENT_STATUSES.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {statusLabels[option]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
