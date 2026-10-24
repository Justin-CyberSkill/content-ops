"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { originHref, parseOrigin } from "@/entities/content";
import { requireAdmin, requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, contentEvent, user } from "@/shared/db/schema";
import {
  createContentFormSchema,
  readContentForm,
} from "../model/content-form";
import { pendingProposalError } from "./pending-proposal";

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

  let approving = false;
  if (id) {
    const [current] = await db
      .select({ status: content.status })
      .from(content)
      .where(eq(content.id, id));
    if (!current) return { error: t("deleted") };

    // Saving a proposal approves it, which only admins do.
    approving = current.status === "proposed";
    if (approving && me.role !== "admin") return { error: t("adminOnly") };

    // The version the admin started editing, so an agent's change since then isn't overwritten unseen.
    const revision = Number(formData.get("revision"));
    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(content)
        .set(approving ? { ...data, reviewedById: me.id } : data)
        .where(
          approving
            ? and(
                eq(content.id, id),
                eq(content.status, "proposed"),
                isNull(content.rejectedAt),
                isNull(content.withdrawnAt),
                eq(content.revision, revision),
              )
            : eq(content.id, id),
        )
        .returning({ id: content.id });
      if (approving && rows.length) {
        await tx.insert(contentEvent).values({
          contentId: id,
          action: "approved",
          userId: me.id,
          actorName: me.name,
        });
      }
      return rows;
    });
    if (!updated.length) {
      if (!approving) return { error: t("deleted") };
      const error = await pendingProposalError(id, revision, { editing: true });
      // Load the agent's new version; the form keeps what was typed.
      refresh();
      return { error };
    }
  } else {
    await db.insert(content).values({ ...data, createdById: me.id });
  }
  // Back to the list the item was opened from. Review says what just happened.
  const from = parseOrigin(formData.get("from"));
  redirect(
    approving && from === "review"
      ? `${originHref(from)}?done=approved`
      : originHref(from),
  );
}

export async function deleteContent(id: string, from: unknown) {
  await requireAdmin();
  await db.delete(content).where(eq(content.id, id));
  redirect(originHref(parseOrigin(from)));
}
