"use client";

import { CheckIcon, CopyIcon, KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { type CreateKeyState, createAgentKey } from "../api/manage-keys";

export function CreateKeyForm() {
  const [state, action, pending] = useActionState<CreateKeyState, FormData>(
    createAgentKey,
    {},
  );
  const [copied, setCopied] = useState(false);
  const t = useTranslations("agents");

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-2">
          <Label htmlFor="key-name">{t("keyName")}</Label>
          <Input
            id="key-name"
            name="name"
            maxLength={40}
            placeholder={t("keyNamePlaceholder")}
            required
            aria-invalid={state.error ? true : undefined}
          />
        </div>
        <Button type="submit" disabled={pending}>
          <KeyRoundIcon aria-hidden="true" />
          {pending ? t("creating") : t("create")}
        </Button>
      </form>
      {state.error ? (
        <p role="alert" className="pl-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.key ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl bg-warning-soft p-4 text-foreground"
        >
          <p className="text-sm font-semibold">
            {t("copyNow", { name: state.name ?? "" })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2 font-mono text-xs break-all">
              {state.key}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(state.key ?? "");
                setCopied(true);
              }}
            >
              {copied ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
