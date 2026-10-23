"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin, requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, user } from "@/shared/db/schema";
import {
  createContentFormSchema,
  readContentForm,
} from "../model/content-form";

export type SaveContentState = { error?: string };

export async function saveContent(
  id: string | null,
  _prev: SaveContentState,
  formData: FormData,
): Promise<SaveContentState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  const parsed = createContentFormSchema((key) => t(key)).safeParse(
    readContentForm(formData),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  if (data.assigneeId) {
    const [assignee] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, data.assigneeId));
    if (!assignee) return { error: t("assigneeGone") };
  }

  if (id) {
    const [current] = await db
      .select({ status: content.status, rejectedAt: content.rejectedAt })
      .from(content)
      .where(eq(content.id, id));
    if (!current) return { error: t("deleted") };

    // Saving a proposal approves it, which only admins do.
    const approving = current.status === "proposed";
    if (approving) {
      if (me.role !== "admin") return { error: t("adminOnly") };
      if (current.rejectedAt) return { error: t("proposalReviewed") };
    }

    const updated = await db
      .update(content)
      .set(approving ? { ...data, reviewedById: me.id } : data)
      .where(
        approving
          ? and(
              eq(content.id, id),
              eq(content.status, "proposed"),
              isNull(content.rejectedAt),
            )
          : eq(content.id, id),
      )
      .returning({ id: content.id });
    if (!updated.length) return { error: t("proposalReviewed") };
    if (approving) redirect("/review");
  } else {
    await db.insert(content).values({ ...data, createdById: me.id });
  }
  redirect("/content");
}

export async function deleteContent(id: string) {
  await requireAdmin();
  await db.delete(content).where(eq(content.id, id));
  redirect("/content");
}
