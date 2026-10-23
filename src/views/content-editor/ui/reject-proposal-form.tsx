"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { type RejectState, rejectProposal } from "../api/review-proposal";
import { REJECTION_MAX_LENGTH } from "../model/rejection";

export function RejectProposalForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<RejectState, FormData>(
    rejectProposal.bind(null, id),
    {},
  );
  const t = useTranslations("contentEditor.proposal");
  return (
    <section
      aria-labelledby="reject-heading"
      className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="reject-heading" className="text-lg font-semibold">
          {t("rejectTitle")}
        </h2>
        <p className="text-[13px] text-muted-foreground">{t("rejectHint")}</p>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reject-reason">{t("rejectReason")}</Label>
          <Textarea
            id="reject-reason"
            name="reason"
            rows={3}
            maxLength={REJECTION_MAX_LENGTH}
            required
            aria-invalid={state.error ? true : undefined}
          />
        </div>
        {state.error ? (
          <p role="alert" className="pl-1 text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          className="self-start"
          disabled={pending}
        >
          <XIcon aria-hidden="true" />
          {pending ? t("rejecting") : t("reject")}
        </Button>
      </form>
    </section>
  );
}
