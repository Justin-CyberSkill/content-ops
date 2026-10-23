import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";

/** Content assigned to `userId`: open items by publish day first, published ones last. */
export async function listMyTasks(userId: string) {
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
    })
    .from(content)
    .where(eq(content.assigneeId, userId))
    .orderBy(
      sql`${content.status} = 'published'`,
      sql`${content.publishDate} asc nulls last`,
      asc(content.goldenTime),
    );
}

export type Task = Awaited<ReturnType<typeof listMyTasks>>[number];
