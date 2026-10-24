import { and, count, eq, inArray, ne, notExists } from "drizzle-orm";
import { db } from "@/shared/db";
import { content, task } from "@/shared/db/schema";

/**
 * For the badge on the sidebar's My tasks link: what's in the user's To do, the same
 * rows My tasks lists there. Their open tasks, plus items from before tasks assigned
 * to them as a whole and not yet published.
 */
export async function countMyTodo(userId: string): Promise<number> {
  const [[tasks], [items]] = await Promise.all([
    db
      .select({ n: count() })
      .from(task)
      .innerJoin(content, eq(task.contentId, content.id))
      .where(
        and(
          eq(task.assigneeId, userId),
          inArray(task.status, ["todo", "in_progress"]),
          ne(content.status, "proposed"),
        ),
      ),
    db
      .select({ n: count() })
      .from(content)
      .where(
        and(
          eq(content.assigneeId, userId),
          inArray(content.status, [
            "planned",
            "in_progress",
            "in_review",
            "scheduled",
          ]),
          notExists(
            db
              .select({ id: task.id })
              .from(task)
              .where(eq(task.contentId, content.id)),
          ),
        ),
      ),
  ]);
  return (tasks?.n ?? 0) + (items?.n ?? 0);
}
