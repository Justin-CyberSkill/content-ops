import { z } from "zod";
import type { Messages } from "@/shared/i18n";

type ErrorKey = keyof Messages["contentEditor"]["errors"];

export const CHANGES_NOTE_MAX_LENGTH = 2_000;

/** Asking for changes: what to change, and which earlier tasks go back to To do. */
export const createChangesSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    note: z
      .string()
      .trim()
      .min(1, t("changesNoteRequired"))
      .max(CHANGES_NOTE_MAX_LENGTH, t("changesNoteTooLong")),
    reopen: z
      .array(z.uuid({ error: t("pickTasksToReopen") }))
      .min(1, t("pickTasksToReopen")),
  });

export function readChangesForm(formData: FormData) {
  return {
    note: String(formData.get("note") ?? ""),
    reopen: formData.getAll("reopen").map(String),
  };
}
