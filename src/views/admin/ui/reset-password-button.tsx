"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { type MemberActionState, resetMemberPassword } from "../api/members";
import { TemporaryPasswordNotice } from "./temporary-password-notice";

export function ResetPasswordButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, setState] = useState<MemberActionState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Reset the password for ${email}?`)) return;
          startTransition(async () =>
            setState(await resetMemberPassword(userId, email)),
          );
        }}
      >
        Reset password
      </Button>
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
