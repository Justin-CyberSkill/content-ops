"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, contentEvent } from "@/shared/db/schema";
import { createRejectionSchema } from "../model/rejection";
import { pendingProposalError } from "./pending-proposal";

export type RejectState = { error?: string };

/** Hides the proposal from the plan. The agent that sent it can read the reason. */
export async function rejectProposal(
  id: string,
  _prev: RejectState,
  formData: FormData,
): Promise<RejectState> {
  const me = await requireAdmin();
  const t = await getTranslations("contentEditor.errors");
  const parsed = createRejectionSchema((key) => t(key)).safeParse(
    String(formData.get("reason") ?? ""),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!z.uuid().safeParse(id).success) return { error: t("deleted") };

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(content)
      .set({
        rejectedAt: new Date(),
        rejectionReason: parsed.data,
        reviewedById: me.id,
      })
      .where(
        and(
          eq(content.id, id),
          eq(content.status, "proposed"),
          isNull(content.rejectedAt),
          isNull(content.withdrawnAt),
        ),
      )
      .returning({ id: content.id });
    if (rows.length) {
      await tx.insert(contentEvent).values({
        contentId: id,
        action: "rejected",
        userId: me.id,
        actorName: me.name,
        note: parsed.data,
      });
    }
    return rows;
  });
  if (!updated.length) return { error: await pendingProposalError(id, null) };
  redirect("/review?done=rejected");
}

export type ApproveState = { error?: string };

/**
 * Approves a proposal as the agent sent it; it joins the plan as planned.
 * `revision` is the version the admin saw, so an agent's later change isn't approved unseen.
 */
export async function approveProposal(
  id: string,
  revision: number,
): Promise<ApproveState> {
  const me = await requireAdmin();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("deleted") };

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(content)
      .set({ status: "planned", reviewedById: me.id })
      .where(
        and(
          eq(content.id, id),
          eq(content.status, "proposed"),
          isNull(content.rejectedAt),
          isNull(content.withdrawnAt),
          eq(content.revision, revision),
        ),
      )
      .returning({ id: content.id });
    if (rows.length) {
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
    const error = await pendingProposalError(id, revision);
    // Show the agent's new version under the message.
    refresh();
    return { error };
  }
  redirect("/review?done=approved");
}

export type RestoreState = { error?: string };

/** Puts an idea an agent withdrew back into Proposals, as it was. */
export async function restoreProposal(id: string): Promise<RestoreState> {
  const me = await requireAdmin();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("deleted") };

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(content)
      .set({ withdrawnAt: null, withdrawReason: null })
      .where(and(eq(content.id, id), isNotNull(content.withdrawnAt)))
      .returning({ id: content.id });
    if (rows.length) {
      await tx.insert(contentEvent).values({
        contentId: id,
        action: "restored",
        userId: me.id,
        actorName: me.name,
      });
    }
    return rows;
  });
  if (!updated.length) return { error: t("notWithdrawn") };
  refresh();
  return {};
}
