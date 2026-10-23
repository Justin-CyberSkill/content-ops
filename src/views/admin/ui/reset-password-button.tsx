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

  return (
    <div className="mt-1 flex w-full flex-col items-center gap-2">
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
      {state.status === "error" ? (
        <p role="alert" className="text-[13px] text-destructive">
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
