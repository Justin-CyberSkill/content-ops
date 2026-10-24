import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db";
import {
  type Content,
  content,
  contentComment,
  contentEvent,
  user,
} from "@/shared/db/schema";
import {
  type IdeaFilter,
  type ProposalInput,
  type ProposalState,
  type ProposalUpdate,
  proposalState,
} from "../model/proposal-input";

/** The agent's API key, as verified by the route handler. */
export type AgentKey = { id: string; name: string };

/**
 * Everything agents can do to ideas, shared by the REST API and the MCP tools.
 * Agents add ideas as pending, and change or withdraw them while they're pending.
 * Once an admin approves or rejects an idea, agents can only read it.
 */

/** Why a change didn't happen: no such idea, or it's no longer pending. */
export type IdeaRefusal =
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "not_pending"; state: ProposalState };

const isPending = and(
  eq(content.status, "proposed"),
  isNull(content.rejectedAt),
  isNull(content.withdrawnAt),
);

const stateFilters: Record<ProposalState, SQL | undefined> = {
  pending: isPending,
  approved: ne(content.status, "proposed"),
  rejected: isNotNull(content.rejectedAt),
  withdrawn: isNotNull(content.withdrawnAt),
};

/** An idea as agents read it. The day and time are the team's local time. */
function toIdea(row: Content) {
  return {
    id: row.id,
    state: proposalState(row),
    idea: row.idea,
    goal: row.goal,
    why: row.proposalReason,
    platforms: row.platforms,
    type: row.type,
    publishDate: row.publishDate,
    goldenTime: row.goldenTime?.slice(0, 5) ?? null,
    assetLinks: row.assetLinks,
    sources: row.sources,
    proposedBy: row.proposedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rejectionReason: row.rejectionReason,
    withdrawReason: row.withdrawReason,
  };
}

export type Idea = ReturnType<typeof toIdea>;

export async function proposeContent(key: AgentKey, input: ProposalInput) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(content)
      .values({
        goal: input.goal,
        idea: input.idea,
        platforms: input.platforms,
        type: input.type,
        publishDate: input.publishDate ?? null,
        goldenTime: input.goldenTime ?? null,
        assetLinks: input.assetLinks,
        sources: input.sources,
        status: "proposed",
        proposedByKeyId: key.id,
        proposedByName: key.name,
        proposalReason: input.why,
      })
      .returning();
    await tx.insert(contentEvent).values({
      contentId: row.id,
      action: "proposed",
      agentKeyId: key.id,
      actorName: key.name,
    });
    return toIdea(row);
  });
}

/** Agent-proposed ideas, newest first. */
export async function listIdeas(key: AgentKey, filter: IdeaFilter) {
  const rows = await db
    .select()
    .from(content)
    .where(
      and(
        isNotNull(content.proposedByKeyId),
        filter.state ? stateFilters[filter.state] : undefined,
        filter.source
          ? arrayContains(content.sources, [filter.source])
          : undefined,
        filter.mine ? eq(content.proposedByKeyId, key.id) : undefined,
      ),
    )
    .orderBy(desc(content.createdAt))
    .limit(filter.limit);
  return rows.map(toIdea);
}

/** One idea with its comments and what happened to it, oldest first. */
export async function getIdea(id: string) {
  if (!z.uuid().safeParse(id).success) return undefined;
  const row = await db.query.content.findFirst({ where: eq(content.id, id) });
  if (!row) return undefined;
  const [comments, history] = await Promise.all([
    db
      .select({
        author: user.name,
        body: contentComment.body,
        createdAt: contentComment.createdAt,
      })
      .from(contentComment)
      .leftJoin(user, eq(contentComment.authorId, user.id))
      .where(eq(contentComment.contentId, id))
      .orderBy(asc(contentComment.createdAt)),
    db
      .select({
        action: contentEvent.action,
        by: contentEvent.actorName,
        fields: contentEvent.fields,
        note: contentEvent.note,
        at: contentEvent.createdAt,
      })
      .from(contentEvent)
      .where(eq(contentEvent.contentId, id))
      .orderBy(asc(contentEvent.createdAt)),
  ]);
  return { ...toIdea(row), comments, history };
}

/** The columns an update touches, by the API's field names. */
function changedColumns(row: Content, update: ProposalUpdate) {
  const next: Partial<typeof content.$inferInsert> = {};
  const fields: string[] = [];
  const set = <K extends keyof typeof next>(
    field: string,
    column: K,
    value: (typeof next)[K],
    current: unknown,
  ) => {
    if (JSON.stringify(value) === JSON.stringify(current)) return;
    next[column] = value;
    fields.push(field);
  };
  if (update.goal !== undefined) set("goal", "goal", update.goal, row.goal);
  if (update.idea !== undefined) set("idea", "idea", update.idea, row.idea);
  if (update.platforms !== undefined)
    set("platforms", "platforms", update.platforms, row.platforms);
  if (update.type !== undefined) set("type", "type", update.type, row.type);
  if (update.publishDate !== undefined)
    set("publishDate", "publishDate", update.publishDate, row.publishDate);
  if (update.goldenTime !== undefined)
    set(
      "goldenTime",
      "goldenTime",
      update.goldenTime,
      row.goldenTime?.slice(0, 5) ?? null,
    );
  if (update.assetLinks !== undefined)
    set("assetLinks", "assetLinks", update.assetLinks, row.assetLinks);
  if (update.why !== undefined)
    set("why", "proposalReason", update.why, row.proposalReason);
  if (update.sources !== undefined)
    set("sources", "sources", update.sources, row.sources);
  return { next, fields };
}

/** Changes a pending idea. Fields that already hold the sent value don't count as changes. */
export async function updateIdea(
  key: AgentKey,
  id: string,
  update: ProposalUpdate,
): Promise<{ ok: true; idea: Idea; changed: string[] } | IdeaRefusal> {
  if (!z.uuid().safeParse(id).success)
    return { ok: false, reason: "not_found" };
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(content)
      .where(eq(content.id, id))
      .for("update");
    if (!row) return { ok: false, reason: "not_found" } as const;
    const state = proposalState(row);
    if (state !== "pending")
      return { ok: false, reason: "not_pending", state } as const;

    const { next, fields } = changedColumns(row, update);
    if (!fields.length) return { ok: true, idea: toIdea(row), changed: [] };

    const [updated] = await tx
      .update(content)
      .set({ ...next, revision: sql`${content.revision} + 1` })
      .where(eq(content.id, id))
      .returning();
    await tx.insert(contentEvent).values({
      contentId: id,
      action: "updated",
      agentKeyId: key.id,
      actorName: key.name,
      fields,
    });
    return { ok: true, idea: toIdea(updated), changed: fields };
  });
}

/** Takes a pending idea out of Proposals. An admin can still see it and restore it. */
export async function withdrawIdea(
  key: AgentKey,
  id: string,
  reason: string | undefined,
): Promise<{ ok: true; idea: Idea } | IdeaRefusal> {
  if (!z.uuid().safeParse(id).success)
    return { ok: false, reason: "not_found" };
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(content)
      .where(eq(content.id, id))
      .for("update");
    if (!row) return { ok: false, reason: "not_found" } as const;
    const state = proposalState(row);
    if (state !== "pending")
      return { ok: false, reason: "not_pending", state } as const;

    const [updated] = await tx
      .update(content)
      .set({ withdrawnAt: new Date(), withdrawReason: reason ?? null })
      .where(eq(content.id, id))
      .returning();
    await tx.insert(contentEvent).values({
      contentId: id,
      action: "withdrawn",
      agentKeyId: key.id,
      actorName: key.name,
      note: reason ?? null,
    });
    return { ok: true, idea: toIdea(updated) };
  });
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
