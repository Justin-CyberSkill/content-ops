"use client";

import { CheckIcon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  approveWork,
  requestChanges,
  type VerdictState,
} from "../api/review-work";
import { CHANGES_NOTE_MAX_LENGTH } from "../model/verdict";
import { Choice } from "./choice";

type Step = { id: string; name: string; assigneeName: string | null };

/**
 * The open review's decision, beside the work it's about. Approving opens the next
 * task. Asking for changes says what to change and sends the tasks that need it
 * back to To do; the review comes round again once they're done.
 */
export function VerdictPanel({
  taskId,
  earlier,
  next,
  reviewedBefore,
}: {
  taskId: string;
  /** Finished tasks before the review, which can be sent back. */
  earlier: Step[];
  /** The task that opens after approving; null when the review is the last. */
  next: Step | null;
  /** There's an earlier review, so badges mark what changed since. */
  reviewedBefore: boolean;
}) {
  const t = useTranslations("contentEditor.verdict");
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<VerdictState>({});
  const [pending, startTransition] = useTransition();

  if (asking)
    return (
      <ChangesForm
        taskId={taskId}
        earlier={earlier}
        onCancel={() => setAsking(false)}
      />
    );

  return (
    <section
      aria-labelledby="verdict-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="verdict-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {reviewedBefore ? t("introAgain") : t("intro")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Choice
          icon={CheckIcon}
          title={pending ? t("approving") : t("approve")}
          hint={
            !next
              ? t("approveLast")
              : next.assigneeName
                ? t("approveNext", { task: next.name, name: next.assigneeName })
                : t("approveNextUnassigned", { task: next.name })
          }
          primary
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setState(await approveWork(taskId));
            })
          }
        />
        {earlier.length ? (
          <Choice
            icon={Undo2Icon}
            title={t("requestChanges")}
            hint={t("requestChangesHint")}
            disabled={pending}
            onClick={() => setAsking(true)}
          />
        ) : null}
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

function ChangesForm({
  taskId,
  earlier,
  onCancel,
}: {
  taskId: string;
  earlier: Step[];
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<VerdictState, FormData>(
    requestChanges.bind(null, taskId),
    {},
  );
  return (
    <section
      aria-labelledby="changes-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="changes-heading" className="text-lg font-semibold">
          {t("contentEditor.verdict.requestChanges")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("contentEditor.verdict.requestHint")}
        </p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="changes-note">
            {t("contentEditor.verdict.note")}
          </Label>
          <Textarea
            id="changes-note"
            name="note"
            rows={3}
            maxLength={CHANGES_NOTE_MAX_LENGTH}
            required
            autoFocus
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 pl-1 text-sm font-medium">
            {t("contentEditor.verdict.sendBackTo")}
          </legend>
          {earlier.map((step) => (
            <label
              key={step.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted px-4 py-3 has-checked:bg-accent"
            >
              <input
                type="checkbox"
                name="reopen"
                value={step.id}
                // With one task to send back, there's nothing to choose.
                defaultChecked={earlier.length === 1}
                className="size-4 accent-primary"
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{step.name}</span>
                <span className="text-sm text-muted-foreground">
                  {step.assigneeName ?? t("common.unassigned")}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {state.error ? (
          <p role="alert" className="pl-1 text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            <Undo2Icon aria-hidden="true" />
            {pending
              ? t("contentEditor.verdict.sending")
              : t("contentEditor.verdict.send")}
          </Button>
        </div>
      </form>
    </section>
  );
}
