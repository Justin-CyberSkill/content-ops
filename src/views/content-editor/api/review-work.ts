"use server";

import { and, eq, inArray, lt } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { taskKind } from "@/entities/task";
import { syncIdea } from "@/entities/task/index.server";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { review, task } from "@/shared/db/schema";
import { createChangesSchema, readChangesForm } from "../model/verdict";

export type VerdictState = { error?: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The review task, locked, if it's open and the actor may decide it. */
async function openReview(
  tx: Tx,
  taskId: string,
  actor: { id: string; role?: string | null },
) {
  const [row] = await tx
    .select({
      contentId: task.contentId,
      position: task.position,
      status: task.status,
      ideaStatus: task.ideaStatus,
      assigneeId: task.assigneeId,
    })
    .from(task)
    .where(eq(task.id, taskId))
    .for("update");
  if (
    !row ||
    taskKind(row.ideaStatus) !== "review" ||
    row.status === "waiting" ||
    row.status === "done"
  )
    return { error: "reviewNotOpen" as const };
  if (actor.role !== "admin" && row.assigneeId !== actor.id)
    return { error: "notYourReview" as const };
  return { row };
}

/** Approves the work: the review is done and the next task opens. */
export async function approveWork(taskId: string): Promise<VerdictState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(taskId).success) return { error: t("reviewNotOpen") };
  const result = await db.transaction(async (tx) => {
    const open = await openReview(tx, taskId, me);
    if (!open.row) return { error: t(open.error) };
    await tx.insert(review).values({
      contentId: open.row.contentId,
      verdict: "approved",
      reviewerId: me.id,
    });
    await tx
      .update(task)
      .set({ status: "done", doneAt: new Date() })
      .where(eq(task.id, taskId));
    await syncIdea(tx, open.row.contentId);
    return {};
  });
  if (!result.error) refresh();
  return result;
}

/**
 * Sends work back: the picked earlier tasks go back to To do with the note, and the
 * review waits until they're done again.
 */
export async function requestChanges(
  taskId: string,
  _state: VerdictState,
  formData: FormData,
): Promise<VerdictState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(taskId).success) return { error: t("reviewNotOpen") };
  const parsed = createChangesSchema((key) => t(key)).safeParse(
    readChangesForm(formData),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await db.transaction(async (tx) => {
    const open = await openReview(tx, taskId, me);
    if (!open.row) return { error: t(open.error) };
    // Only finished tasks before this review can go back.
    const reopen = await tx
      .select({ id: task.id, name: task.name })
      .from(task)
      .where(
        and(
          eq(task.contentId, open.row.contentId),
          inArray(task.id, parsed.data.reopen),
          lt(task.position, open.row.position),
          eq(task.status, "done"),
        ),
      )
      .orderBy(task.position);
    if (!reopen.length) return { error: t("pickTasksToReopen") };
    const [row] = await tx
      .insert(review)
      .values({
        contentId: open.row.contentId,
        verdict: "changes_requested",
        note: parsed.data.note,
        reopenedTasks: reopen.map((item) => item.name),
        reviewerId: me.id,
      })
      .returning({ id: review.id });
    await tx
      .update(task)
      .set({ status: "todo", doneAt: null, reopenedByReviewId: row.id })
      .where(
        inArray(
          task.id,
          reopen.map((item) => item.id),
        ),
      );
    await syncIdea(tx, open.row.contentId);
    return {};
  });
  if (!result.error) refresh();
  return result;
}
