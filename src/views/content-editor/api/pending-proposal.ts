import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";

/**
 * Why a decision on a proposal didn't go through: it's gone, someone already
 * decided or an agent withdrew it, or an agent changed it since `revision`.
 */
export async function pendingProposalError(
  id: string,
  revision: number | null,
  { editing = false } = {},
): Promise<string> {
  const t = await getTranslations("contentEditor.errors");
  const [current] = await db
    .select({
      status: content.status,
      rejectedAt: content.rejectedAt,
      withdrawnAt: content.withdrawnAt,
      revision: content.revision,
    })
    .from(content)
    .where(eq(content.id, id));
  if (!current) return t("deleted");
  if (current.withdrawnAt) return t("proposalWithdrawn");
  if (current.status !== "proposed" || current.rejectedAt)
    return t("proposalReviewed");
  if (revision !== null && current.revision !== revision)
    return t(editing ? "proposalChangedWhileEditing" : "proposalChanged");
  return t("proposalReviewed");
}
