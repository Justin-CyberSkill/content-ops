"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { Role } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { createMember, type MemberActionState } from "../api/members";
import { TemporaryPasswordNotice } from "./temporary-password-notice";

// Member first: it is the default choice.
const roles: Role[] = ["member", "admin"];

export function CreateMemberForm() {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(
    createMember,
    { status: "idle" },
  );
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-name">{t("admin.name")}</Label>
          <Input id="member-name" name="name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-email">{t("admin.email")}</Label>
          <Input id="member-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-role">{t("admin.role")}</Label>
          <NativeSelect
            id="member-role"
            name="role"
            defaultValue="member"
            className="w-full"
          >
            {roles.map((role) => (
              <NativeSelectOption key={role} value={role}>
                {t(`common.roles.${role}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="pl-1 text-xs text-muted-foreground">
            {t("admin.roleHint")}
          </p>
        </div>
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? t("admin.adding") : t("admin.add")}
        </Button>
      </form>
      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive-soft px-4 py-3 text-[13px]"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "done" ? (
        <TemporaryPasswordNotice
          email={state.email}
          password={state.password}
        />
      ) : null}
    </div>
  );
}
