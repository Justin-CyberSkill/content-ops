import { and, asc, desc, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/shared/db";
import { content, user } from "@/shared/db/schema";
import { type ProposalInput, proposalState } from "../model/proposal-input";

/** The agent's API key, as verified by the route handler. */
export type AgentKey = { id: string; name: string };

/**
 * The one way an idea gets in as "proposed". REST calls it today; an MCP tool can later.
 * Agents can only add proposals: no edits, deletes or approvals.
 */
export async function proposeContent(key: AgentKey, input: ProposalInput) {
  const [row] = await db
    .insert(content)
    .values({
      goal: input.goal,
      idea: input.idea,
      platforms: input.platforms,
      type: input.type,
      publishDate: input.publishDate ?? null,
      goldenTime: input.goldenTime ?? null,
      assetLinks: input.assetLinks,
      status: "proposed",
      proposedByKeyId: key.id,
      proposedByName: key.name,
      proposalReason: input.why,
    })
    .returning({ id: content.id, createdAt: content.createdAt });
  return { id: row.id, state: "pending" as const, createdAt: row.createdAt };
}

/** The plan between two days, without proposals, so agents can avoid clashes and gaps. */
export async function listPlanForAgent(range: { from: string; to: string }) {
  return db
    .select({
      id: content.id,
      goal: content.goal,
      idea: content.idea,
      platforms: content.platforms,
      type: content.type,
      publishDate: content.publishDate,
      goldenTime: content.goldenTime,
      status: content.status,
      assignee: user.name,
    })
    .from(content)
    .leftJoin(user, eq(content.assigneeId, user.id))
    .where(
      and(
        ne(content.status, "proposed"),
        gte(content.publishDate, range.from),
        lte(content.publishDate, range.to),
      ),
    )
    .orderBy(asc(content.publishDate), asc(content.goldenTime));
}

/** This key's proposals, newest first, with the reason for each rejection. */
export async function listProposalsForKey(keyId: string, limit = 50) {
  const rows = await db
    .select({
      id: content.id,
      idea: content.idea,
      goal: content.goal,
      why: content.proposalReason,
      status: content.status,
      rejectedAt: content.rejectedAt,
      rejectionReason: content.rejectionReason,
      createdAt: content.createdAt,
    })
    .from(content)
    .where(eq(content.proposedByKeyId, keyId))
    .orderBy(desc(content.createdAt))
    .limit(limit);
  return rows.map(({ status, rejectedAt, rejectionReason, ...row }) => ({
    ...row,
    state: proposalState({ status, rejectedAt }),
    rejectionReason,
  }));
}
