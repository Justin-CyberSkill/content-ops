"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";
import { createRejectionSchema } from "../model/rejection";

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

  const updated = await db
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
      ),
    )
    .returning({ id: content.id });
  if (!updated.length) return { error: t("proposalReviewed") };
  redirect("/review?done=rejected");
}

export type ApproveState = { error?: string };

/** Approves a proposal as the agent sent it; it joins the plan as planned. */
export async function approveProposal(id: string): Promise<ApproveState> {
  const me = await requireAdmin();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(id).success) return { error: t("deleted") };

  const updated = await db
    .update(content)
    .set({ status: "planned", reviewedById: me.id })
    .where(
      and(
        eq(content.id, id),
        eq(content.status, "proposed"),
        isNull(content.rejectedAt),
      ),
    )
    .returning({ id: content.id });
  if (!updated.length) return { error: t("proposalReviewed") };
  redirect("/review?done=approved");
}
