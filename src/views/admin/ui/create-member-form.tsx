"use client";

import { useActionState } from "react";
import type { Role } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { createMember, type MemberActionState } from "../api/members";
import { TemporaryPasswordNotice } from "./temporary-password-notice";

const roleLabels: Record<Role, string> = { member: "Member", admin: "Admin" };

export function CreateMemberForm() {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(
    createMember,
    { status: "idle" },
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        action={action}
        className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-name">Name</Label>
          <Input id="member-name" name="name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-email">Email</Label>
          <Input id="member-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-role">Role</Label>
          <NativeSelect id="member-role" name="role" defaultValue="member">
            {Object.entries(roleLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add member"}
        </Button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
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
