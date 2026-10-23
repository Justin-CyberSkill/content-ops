"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { statusColorClasses } from "@/entities/content";
import { type ContentStatus, PLAN_STATUSES } from "@/shared/db/schema";
import { cn } from "@/shared/lib";
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
  const t = useTranslations("content.status");

  return (
    <div className="flex flex-col items-end gap-1">
      <NativeSelect
        size="sm"
        className={cn("rounded-full", statusColorClasses[value])}
        selectClassName="bg-transparent font-semibold inset-shadow-none"
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
        {PLAN_STATUSES.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {t(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
