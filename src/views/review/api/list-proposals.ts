import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";

const pending = and(eq(content.status, "proposed"), isNull(content.rejectedAt));

/** Agent proposals nobody has approved or rejected yet, oldest first. */
export async function listPendingProposals() {
  return db
    .select({
      id: content.id,
      idea: content.idea,
      goal: content.goal,
      platforms: content.platforms,
      type: content.type,
      publishDate: content.publishDate,
      goldenTime: content.goldenTime,
      proposedByName: content.proposedByName,
      proposalReason: content.proposalReason,
      createdAt: content.createdAt,
    })
    .from(content)
    .where(pending)
    .orderBy(asc(content.createdAt));
}

export type Proposal = Awaited<ReturnType<typeof listPendingProposals>>[number];

/** For the badge on the sidebar's Review link. */
export async function countPendingProposals(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(content).where(pending);
  return row?.n ?? 0;
}
