import { and, asc, count, desc, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";

const pending = and(
  eq(content.status, "proposed"),
  isNull(content.rejectedAt),
  isNull(content.withdrawnAt),
);

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
      updatedAt: content.updatedAt,
      revision: content.revision,
    })
    .from(content)
    .where(pending)
    .orderBy(asc(content.createdAt));
}

export type Proposal = Awaited<ReturnType<typeof listPendingProposals>>[number];

const CLOSED_DAYS = 30;

/** Proposals rejected or withdrawn lately, newest first, so a decision can be checked or undone. */
export async function listClosedProposals(now = new Date()) {
  const since = new Date(now.getTime() - CLOSED_DAYS * 86_400_000);
  const rows = await db
    .select({
      id: content.id,
      idea: content.idea,
      proposedByName: content.proposedByName,
      rejectedAt: content.rejectedAt,
      rejectionReason: content.rejectionReason,
      withdrawnAt: content.withdrawnAt,
      withdrawReason: content.withdrawReason,
    })
    .from(content)
    .where(
      and(
        eq(content.status, "proposed"),
        or(gte(content.rejectedAt, since), gte(content.withdrawnAt, since)),
      ),
    )
    .orderBy(desc(content.updatedAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    idea: row.idea,
    proposedByName: row.proposedByName,
    closed: row.rejectedAt
      ? {
          as: "rejected" as const,
          at: row.rejectedAt,
          reason: row.rejectionReason,
        }
      : {
          as: "withdrawn" as const,
          // The query only returns rows with one of the two set.
          at: row.withdrawnAt ?? now,
          reason: row.withdrawReason,
        },
  }));
}

export type ClosedProposal = Awaited<
  ReturnType<typeof listClosedProposals>
>[number];

/** For the badge on the sidebar's Review link. */
export async function countPendingProposals(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(content).where(pending);
  return row?.n ?? 0;
}
