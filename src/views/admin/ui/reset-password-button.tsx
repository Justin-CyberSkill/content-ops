"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin");

  // Lays out inside a member row: the button keeps a fixed slot at the end, and the
  // new password or an error takes a line of its own underneath.
  return (
    <>
      <div className="flex justify-end sm:w-40">
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm(t("confirmReset", { email }))) return;
            startTransition(async () =>
              setState(await resetMemberPassword(userId, email)),
            );
          }}
        >
          <RotateCcwIcon aria-hidden="true" />
          {pending ? t("resetting") : t("resetPassword")}
        </Button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="basis-full text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.status === "done" ? (
        <div className="basis-full">
          <TemporaryPasswordNotice
            email={state.email}
            password={state.password}
          />
        </div>
      ) : null}
    </>
  );
}
