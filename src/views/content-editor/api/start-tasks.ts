"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createTasks, hasTasks } from "@/entities/task/index.server";
import { requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";
import { type AssignmentValues, parseAssignments } from "../model/assignments";

export type StartTasksState = { error?: string };

/**
 * Splits an item from before tasks into its content type's steps, starting from the
 * first. From then on its status and owner follow the tasks.
 */
export async function startTasks(
  id: string,
  assignments: AssignmentValues,
): Promise<StartTasksState> {
  await requireAdmin();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("deleted") };

  const error = await db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: content.id,
        type: content.type,
        publishDate: content.publishDate,
      })
      .from(content)
      .where(and(eq(content.id, id), ne(content.status, "proposed")))
      .for("update");
    if (!item) return t("deleted");
    if (await hasTasks(id, tx)) return t("alreadyTasks");
    await createTasks(tx, item, parseAssignments(assignments));
    if (!(await hasTasks(id, tx))) return t("noSteps");
    return null;
  });
  if (error) return { error };
  refresh();
  return {};
}
