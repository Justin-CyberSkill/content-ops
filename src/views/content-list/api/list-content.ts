import { asc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { content, task, user } from "@/shared/db/schema";
import { progressOf } from "../model/progress";

/**
 * Every item on the plan, soonest publish day first; undated items last. Proposals wait
 * in Review. Each item says where it stands: its open task and how many are done.
 */
export async function listContent() {
  const rows = await db
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
  const tasks = rows.length
    ? await db
        .select({
          contentId: task.contentId,
          name: task.name,
          status: task.status,
          dueDate: task.dueDate,
        })
        .from(task)
        .where(
          inArray(
            task.contentId,
            rows.map((row) => row.id),
          ),
        )
        .orderBy(asc(task.position))
    : [];
  return rows.map((row) => ({
    ...row,
    progress: progressOf(tasks.filter((item) => item.contentId === row.id)),
  }));
}

export type ContentRow = Awaited<ReturnType<typeof listContent>>[number];
