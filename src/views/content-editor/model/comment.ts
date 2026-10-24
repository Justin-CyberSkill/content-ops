import { z } from "zod";

export const COMMENT_MAX_LENGTH = 5000;

type ErrorKey = "commentRequired" | "commentTooLong";

/** The comment text, trimmed. Messages come from `t` so they follow the language. */
export function createCommentSchema(t: (key: ErrorKey) => string) {
  return z
    .string()
    .trim()
    .min(1, t("commentRequired"))
    .max(COMMENT_MAX_LENGTH, t("commentTooLong"));
}
