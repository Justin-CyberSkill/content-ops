"use client";

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
    label: "Current password",
    auto: "current-password",
  },
  { name: "newPassword", label: "New password", auto: "new-password" },
  {
    name: "confirmPassword",
    label: "Repeat new password",
    auto: "new-password",
  },
] as const;

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, { status: "idle" });

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <Label htmlFor={field.name}>{field.label}</Label>
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
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}
      {state.status === "done" ? (
        <p role="status" className="text-sm">
          Password changed.
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
