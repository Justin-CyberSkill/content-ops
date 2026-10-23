import { asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { content, user } from "@/shared/db/schema";

/** Every item on the plan, soonest publish day first; undated items last. Proposals wait in Review. */
export async function listContent() {
  return db
    .select({
      id: content.id,
      idea: content.idea,
      goal: content.goal,
      platforms: content.platforms,
      type: content.type,
      publishDate: content.publishDate,
      goldenTime: content.goldenTime,
      status: content.status,
      assetLinks: content.assetLinks,
      assigneeName: user.name,
    })
    .from(content)
    .leftJoin(user, eq(content.assigneeId, user.id))
    .where(ne(content.status, "proposed"))
    .orderBy(
      sql`${content.publishDate} asc nulls last`,
      asc(content.goldenTime),
      asc(content.createdAt),
    );
}

export type ContentRow = Awaited<ReturnType<typeof listContent>>[number];
