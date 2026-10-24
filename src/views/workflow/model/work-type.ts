import { z } from "zod";
import { IDEA_STATUSES_WHILE_OPEN } from "@/shared/db/schema";
import type { Messages } from "@/shared/i18n";

type ErrorKey = keyof Messages["workflow"]["errors"];

export const WORK_TYPE_NAME_MAX = 60;
export const DAYS_BEFORE_MAX = 60;

/** `t` turns an error key into text, such as getTranslations("workflow.errors"). */
export const createWorkTypeSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("nameRequired"))
      .max(WORK_TYPE_NAME_MAX, t("nameTooLong")),
    ideaStatus: z.enum(IDEA_STATUSES_WHILE_OPEN, {
      error: t("ideaStatusRequired"),
    }),
  });

/** A content type's steps from its form: each ticked work type, with its days before publishing. */
export const createStepsSchema = (t: (key: ErrorKey) => string) =>
  z.array(
    z.object({
      workTypeId: z.uuid(),
      daysBefore: z.coerce
        .number({ error: t("invalidDays") })
        .int(t("invalidDays"))
        .min(0, t("invalidDays"))
        .max(DAYS_BEFORE_MAX, t("invalidDays")),
    }),
  );

/** Form fields: `work` holds each ticked work type's id; `days:<id>` its days before publishing. */
export function readSteps(formData: FormData) {
  return formData.getAll("work").map((id) => ({
    workTypeId: String(id),
    daysBefore: String(formData.get(`days:${id}`) ?? ""),
  }));
}
