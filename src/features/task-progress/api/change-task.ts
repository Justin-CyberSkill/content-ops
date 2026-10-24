"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { setTaskAssignee, setTaskStatus } from "@/entities/task/index.server";
import { requireAdmin, requireUser } from "@/shared/auth/index.server";

export type ChangeTaskState = { error?: string };

const statusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(["todo", "in_progress", "done"]),
});

/** Moves a task along. Its assignee or an admin can; the idea's status follows. */
export async function changeTaskStatus(
  taskId: string,
  status: string,
): Promise<ChangeTaskState> {
  const me = await requireUser();
  const t = await getTranslations("task.errors");
  const parsed = statusSchema.safeParse({ taskId, status });
  if (!parsed.success) return { error: t("invalidStatus") };
  const result = await setTaskStatus(parsed.data.taskId, parsed.data.status, {
    id: me.id,
    isAdmin: me.role === "admin",
  });
  if (result.error) return { error: t(result.error) };
  refresh();
  return {};
}

const assigneeSchema = z.object({
  taskId: z.uuid(),
  assigneeId: z.string().transform((value) => value || null),
});

/** Gives a task to someone else, or no one. Admins only. */
export async function changeTaskAssignee(
  taskId: string,
  assigneeId: string,
): Promise<ChangeTaskState> {
  await requireAdmin();
  const t = await getTranslations("task.errors");
  const parsed = assigneeSchema.safeParse({ taskId, assigneeId });
  if (!parsed.success) return { error: t("notFound") };
  const result = await setTaskAssignee(
    parsed.data.taskId,
    parsed.data.assigneeId,
  );
  if (result.error) return { error: t(result.error) };
  refresh();
  return {};
}
