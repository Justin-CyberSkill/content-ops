"use server";

import { and, asc, eq, inArray, max, notInArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import {
  CONTENT_TYPES,
  memberWorkType,
  user,
  workflowStep,
  workType,
} from "@/shared/db/schema";
import {
  createStepsSchema,
  createWorkTypeSchema,
  readSteps,
} from "../model/work-type";

export type WorkflowState = { error?: string; saved?: boolean };

/** Adds a kind of work at the end of the order. No content type needs it until ticked. */
export async function addWorkType(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  const parsed = createWorkTypeSchema((key) => t(key)).safeParse({
    name: formData.get("name") ?? "",
    ideaStatus: formData.get("ideaStatus"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.transaction(async (tx) => {
    const [last] = await tx
      .select({ position: max(workType.position) })
      .from(workType);
    await tx
      .insert(workType)
      .values({ ...parsed.data, position: (last?.position ?? -1) + 1 });
  });
  refresh();
  return { saved: true };
}

/** Renames a kind of work or changes what the idea shows as during it. Tasks already made keep theirs. */
export async function updateWorkType(
  id: string,
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  const parsed = createWorkTypeSchema((key) => t(key)).safeParse({
    name: formData.get("name") ?? "",
    ideaStatus: formData.get("ideaStatus"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!z.uuid().safeParse(id).success) return { error: t("gone") };
  const rows = await db
    .update(workType)
    .set(parsed.data)
    .where(eq(workType.id, id))
    .returning({ id: workType.id });
  if (!rows.length) return { error: t("gone") };
  refresh();
  return { saved: true };
}

/** Moves a kind of work one place earlier or later. Steps follow this order. */
export async function moveWorkType(
  id: string,
  direction: "up" | "down",
): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("gone") };
  await db.transaction(async (tx) => {
    const types = await tx
      .select({ id: workType.id })
      .from(workType)
      .orderBy(asc(workType.position), asc(workType.createdAt))
      .for("update");
    const from = types.findIndex((type) => type.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= types.length) return;
    [types[from], types[to]] = [types[to], types[from]];
    // Renumber all of them, so positions stay 0, 1, 2… whatever they were before.
    for (const [position, type] of types.entries()) {
      await tx
        .update(workType)
        .set({ position })
        .where(eq(workType.id, type.id));
    }
  });
  refresh();
  return {};
}

/** Removes a kind of work and its steps. Tasks already made keep their name. */
export async function deleteWorkType(id: string): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("gone") };
  await db.delete(workType).where(eq(workType.id, id));
  refresh();
  return {};
}

/** Says whether a member does a kind of work, so they're suggested for it. */
export async function setDoer(
  workTypeId: string,
  userId: string,
  does: boolean,
): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  if (!z.uuid().safeParse(workTypeId).success) return { error: t("gone") };
  if (does) {
    const [[type], [member]] = await Promise.all([
      db
        .select({ id: workType.id })
        .from(workType)
        .where(eq(workType.id, workTypeId)),
      db.select({ id: user.id }).from(user).where(eq(user.id, userId)),
    ]);
    if (!type || !member) return { error: t("gone") };
    await db
      .insert(memberWorkType)
      .values({ workTypeId, userId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(memberWorkType)
      .where(
        and(
          eq(memberWorkType.workTypeId, workTypeId),
          eq(memberWorkType.userId, userId),
        ),
      );
  }
  refresh();
  return {};
}

/** Sets which kinds of work a content type needs, and how many days before publishing each is due. */
export async function saveSteps(
  contentType: string,
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  await requireAdmin();
  const t = await getTranslations("workflow.errors");
  const type = z.enum(CONTENT_TYPES).safeParse(contentType);
  const parsed = createStepsSchema((key) => t(key)).safeParse(
    readSteps(formData),
  );
  if (!type.success) return { error: t("gone") };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const steps = parsed.data;
  const ids = steps.map((step) => step.workTypeId);

  await db.transaction(async (tx) => {
    // Only work types that still exist, so a stale form can't add a removed one back.
    const known = ids.length
      ? (
          await tx
            .select({ id: workType.id })
            .from(workType)
            .where(inArray(workType.id, ids))
        ).map((row) => row.id)
      : [];
    await tx
      .delete(workflowStep)
      .where(
        and(
          eq(workflowStep.contentType, type.data),
          known.length ? notInArray(workflowStep.workTypeId, known) : undefined,
        ),
      );
    for (const step of steps) {
      if (!known.includes(step.workTypeId)) continue;
      // Upsert keeps each step's id, so a review page open meanwhile still matches.
      await tx
        .insert(workflowStep)
        .values({ contentType: type.data, ...step })
        .onConflictDoUpdate({
          target: [workflowStep.contentType, workflowStep.workTypeId],
          set: { daysBefore: step.daysBefore },
        });
    }
  });
  refresh();
  return { saved: true };
}
