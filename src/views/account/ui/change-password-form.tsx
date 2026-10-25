"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  type ChangePasswordState,
  changePassword,
} from "../api/change-password";

const fields = [
  {
    name: "currentPassword",
    label: "currentPassword",
    auto: "current-password",
  },
  { name: "newPassword", label: "newPassword", auto: "new-password" },
  {
    name: "confirmPassword",
    label: "confirmPassword",
    auto: "new-password",
  },
] as const;

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, { status: "idle" });
  const t = useTranslations("account");
  const tCommon = useTranslations("common");

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <Label htmlFor={field.name}>{t(field.label)}</Label>
          <Input
            id={field.name}
            name={field.name}
            type="password"
            autoComplete={field.auto}
            required
          />
        </div>
      ))}
      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive-soft px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "done" ? (
        <p
          role="status"
          className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium"
        >
          {t("changed")}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? tCommon("saving") : t("changePassword")}
      </Button>
    </form>
  );
}
