"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { originHref, parseOrigin } from "@/entities/content";
import {
  createTasks,
  hasTasks,
  moveDueDates,
} from "@/entities/task/index.server";
import { requireAdmin, requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, contentEvent, user } from "@/shared/db/schema";
import { redirect } from "@/shared/i18n";
import { parseAssignments, readAssignments } from "../model/assignments";
import {
  type ContentFormValues,
  createContentFormSchema,
  readContentForm,
} from "../model/content-form";
import { pendingProposalError } from "./pending-proposal";

/** `field` names the input an error is about, so the form shows it there. */
export type SaveContentState = {
  error?: string;
  field?: keyof ContentFormValues;
};

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
  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    return {
      error: issue.message,
      field: issue.path[0] as keyof ContentFormValues,
    };
  }

  const data = parsed.data;
  const assignments = parseAssignments(readAssignments(formData));
  if (data.assigneeId) {
    const [assignee] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, data.assigneeId));
    if (!assignee) return { error: t("assigneeGone"), field: "assigneeId" };
  }

  let approving = false;
  if (id) {
    const [current] = await db
      .select({ status: content.status, publishDate: content.publishDate })
      .from(content)
      .where(eq(content.id, id));
    if (!current) return { error: t("deleted") };

    // Saving a proposal approves it, which only admins do.
    approving = current.status === "proposed";
    if (approving && me.role !== "admin") return { error: t("adminOnly") };
    // An item with tasks gets its status and owner from them, so the form's are ignored.
    const followsTasks = !approving && (await hasTasks(id));
    const { status, assigneeId, ...details } = data;

    // The version the admin started editing, so an agent's change since then isn't overwritten unseen.
    const revision = Number(formData.get("revision"));
    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(content)
        .set(
          approving
            ? { ...data, reviewedById: me.id }
            : followsTasks
              ? details
              : data,
        )
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
      if (!rows.length) return rows;
      if (approving) {
        await tx.insert(contentEvent).values({
          contentId: id,
          action: "approved",
          userId: me.id,
          actorName: me.name,
        });
        await createTasks(
          tx,
          { id, type: data.type, publishDate: data.publishDate },
          assignments,
        );
      } else if (followsTasks && details.publishDate !== current.publishDate) {
        await moveDueDates(tx, id, details.publishDate);
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
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(content)
        .values({ ...data, createdById: me.id })
        .returning({ id: content.id });
      await createTasks(
        tx,
        { id: row.id, type: data.type, publishDate: data.publishDate },
        assignments,
      );
    });
  }
  // Back to the list the item was opened from. Review says what just happened.
  const from = parseOrigin(formData.get("from"));
  return redirect({
    href:
      approving && from === "review"
        ? `${originHref(from)}?done=approved`
        : originHref(from),
    locale: await getLocale(),
  });
}

export async function deleteContent(id: string, from: unknown) {
  await requireAdmin();
  await db.delete(content).where(eq(content.id, id));
  redirect({ href: originHref(parseOrigin(from)), locale: await getLocale() });
}
