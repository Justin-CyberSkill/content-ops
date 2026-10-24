"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, PLAN_STATUSES, user } from "@/shared/db/schema";

export type ProgressState = { error?: string; saved?: boolean };

const schema = z.object({
  status: z.enum(PLAN_STATUSES),
  assigneeId: z
    .string()
    .transform((value) => value || null)
    .nullable(),
});

/** The quick change on an item page: status and owner, without opening the full form. */
export async function updateProgress(
  id: string,
  _prev: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  await requireUser();
  const t = await getTranslations("contentEditor.errors");
  const parsed = schema.safeParse({
    status: formData.get("status"),
    assigneeId: formData.get("assigneeId") ?? "",
  });
  if (!parsed.success || !z.uuid().safeParse(id).success)
    return { error: t("invalidProgress") };

  const { status, assigneeId } = parsed.data;
  if (assigneeId) {
    const [assignee] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, assigneeId));
    if (!assignee) return { error: t("assigneeGone") };
  }

  const updated = await db
    .update(content)
    .set({ status, assigneeId })
    .where(and(eq(content.id, id), ne(content.status, "proposed")))
    .returning({ id: content.id });
  if (!updated.length) return { error: t("deleted") };

  refresh();
  return { saved: true };
}
