import { z } from "zod";

export const REJECTION_MAX_LENGTH = 1000;

type ErrorKey = "rejectReasonRequired" | "rejectReasonTooLong";

/** Why a proposal was turned down, trimmed. Agents read it to propose better. */
export function createRejectionSchema(t: (key: ErrorKey) => string) {
  return z
    .string()
    .trim()
    .min(1, t("rejectReasonRequired"))
    .max(REJECTION_MAX_LENGTH, t("rejectReasonTooLong"));
}
