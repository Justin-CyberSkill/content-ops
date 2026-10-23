"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { CONTENT_STATUSES, content } from "@/shared/db/schema";

const schema = z.object({ id: z.uuid(), status: z.enum(CONTENT_STATUSES) });

export async function updateTaskStatus(
  id: string,
  status: string,
): Promise<{ error?: string }> {
  const me = await requireUser();
  const t = await getTranslations("myTasks.errors");
  const parsed = schema.safeParse({ id, status });
  if (!parsed.success) return { error: t("invalidStatus") };

  // Members can only move their own tasks.
  const updated = await db
    .update(content)
    .set({ status: parsed.data.status })
    .where(and(eq(content.id, parsed.data.id), eq(content.assigneeId, me.id)))
    .returning({ id: content.id });
  if (!updated.length) return { error: t("notAssigned") };

  refresh();
  return {};
}
