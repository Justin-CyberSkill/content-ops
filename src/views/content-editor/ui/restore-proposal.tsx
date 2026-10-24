"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { type RestoreState, restoreProposal } from "../api/review-proposal";
import { Choice } from "./choice";

/** The one choice on a withdrawn idea: put it back in Proposals. */
export function RestoreProposal({ id }: { id: string }) {
  const t = useTranslations("contentEditor.proposal");
  const [state, setState] = useState<RestoreState>({});
  const [pending, startTransition] = useTransition();
  return (
    <section
      aria-labelledby="restore-heading"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <h2 id="restore-heading" className="text-lg font-semibold">
        {t("decideTitle")}
      </h2>
      <Choice
        icon={RotateCcwIcon}
        title={pending ? t("restoring") : t("restore")}
        hint={t("restoreHint")}
        primary
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setState(await restoreProposal(id));
          })
        }
      />
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
