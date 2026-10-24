"use client";

import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";
import type { ContentOrigin } from "@/entities/content";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import type { Member } from "../api/queries";
import {
  type ApproveState,
  approveProposal,
  type RejectState,
  rejectProposal,
} from "../api/review-proposal";
import type { ContentFormValues } from "../model/content-form";
import { REJECTION_MAX_LENGTH } from "../model/rejection";
import { ContentForm } from "./content-form";

type Mode = "decide" | "edit" | "reject";

/**
 * Reviewing a proposal is read, then decide. On wide screens the proposal reads on
 * the left and the decision stays in view on the right; narrower screens stack them.
 * Rejecting opens in the decision panel; editing takes the whole width, since the
 * form needs it and the summary would only repeat it.
 */
export function ProposalReview({
  id,
  from,
  initial,
  members,
  summary,
  comments,
}: {
  id: string;
  from: ContentOrigin;
  initial: ContentFormValues;
  members: Member[];
  /** The read-only proposal, rendered on the server. */
  summary: React.ReactNode;
  comments: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("decide");
  const t = useTranslations("contentEditor.proposal");

  if (mode === "edit") {
    return (
      <>
        <section aria-labelledby="edit-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="edit-heading" className="text-lg font-semibold">
              {t("editTitle")}
            </h2>
            <p className="text-[13px] text-muted-foreground">{t("editHint")}</p>
          </div>
          <ContentForm
            id={id}
            from={from}
            initial={initial}
            members={members}
            approving
            onCancel={() => setMode("decide")}
          />
        </section>
        {/* Same columns as the form, so the thread lines up under the brief. */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          {comments}
        </div>
      </>
    );
  }

  // One DOM order for every size (proposal, decision, comments); from xl the decision
  // moves to a right column that spans both rows and stays in view.
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
      <div className="min-w-0 xl:col-start-1 xl:row-start-1">{summary}</div>
      <div className="min-w-0 xl:sticky xl:top-8 xl:col-start-2 xl:row-span-2 xl:row-start-1">
        {mode === "decide" ? (
          <Decision
            id={id}
            onEdit={() => setMode("edit")}
            onReject={() => setMode("reject")}
          />
        ) : (
          <RejectForm id={id} onCancel={() => setMode("decide")} />
        )}
      </div>
      <div className="min-w-0 xl:col-start-1 xl:row-start-2">{comments}</div>
    </div>
  );
}

function Decision({
  id,
  onEdit,
  onReject,
}: {
  id: string;
  onEdit: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("contentEditor.proposal");
  const [state, setState] = useState<ApproveState>({});
  const [pending, startTransition] = useTransition();

  return (
    <section
      aria-labelledby="decide-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <h2 id="decide-heading" className="text-lg font-semibold">
        {t("decideTitle")}
      </h2>
      <div className="flex flex-col gap-2">
        <Choice
          icon={CheckIcon}
          title={pending ? t("approving") : t("approve")}
          hint={t("approveHint")}
          primary
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await approveProposal(id));
            })
          }
        />
        <Choice
          icon={PencilIcon}
          title={t("editOption")}
          hint={t("editOptionHint")}
          disabled={pending}
          onClick={onEdit}
        />
        <Choice
          icon={XIcon}
          title={t("reject")}
          hint={t("rejectOptionHint")}
          disabled={pending}
          onClick={onReject}
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive-soft px-5 py-3.5 text-foreground"
        >
          {state.error}
        </p>
      ) : null}
    </section>
  );
}

/** A whole-row button: what happens, and a line on what it means. */
function Choice({
  icon: Icon,
  title,
  hint,
  primary,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
        primary
          ? "bg-primary text-primary-foreground hover:brightness-110"
          : "bg-muted hover:bg-muted-strong",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          primary ? "bg-primary-foreground/15" : "bg-card",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span
          className={cn(
            "text-[13px]",
            primary ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

function RejectForm({ id, onCancel }: { id: string; onCancel: () => void }) {
  const [state, action, pending] = useActionState<RejectState, FormData>(
    rejectProposal.bind(null, id),
    {},
  );
  const t = useTranslations();
  return (
    <section
      aria-labelledby="reject-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="reject-heading" className="text-lg font-semibold">
          {t("contentEditor.proposal.rejectTitle")}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {t("contentEditor.proposal.rejectHint")}
        </p>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reject-reason">
            {t("contentEditor.proposal.rejectReason")}
          </Label>
          <Textarea
            id="reject-reason"
            name="reason"
            rows={3}
            maxLength={REJECTION_MAX_LENGTH}
            required
            autoFocus
            aria-invalid={state.error ? true : undefined}
          />
        </div>
        {state.error ? (
          <p role="alert" className="pl-1 text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            <XIcon aria-hidden="true" />
            {pending
              ? t("contentEditor.proposal.rejecting")
              : t("contentEditor.proposal.rejectConfirm")}
          </Button>
        </div>
      </form>
    </section>
  );
}
