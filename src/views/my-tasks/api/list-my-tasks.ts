import {
  and,
  asc,
  eq,
  gte,
  inArray,
  ne,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/shared/db";
import {
  type ContentStatus,
  content,
  type TaskStatus,
  task,
  user,
} from "@/shared/db/schema";

/** How far back finished work stays on the list. */
const DONE_DAYS = 30;

const contentColumns = {
  id: content.id,
  idea: content.idea,
  goal: content.goal,
  platforms: content.platforms,
  type: content.type,
  publishDate: content.publishDate,
  goldenTime: content.goldenTime,
  status: content.status,
  assetLinks: content.assetLinks,
};

export type MyTask = {
  /** Unique per row: the task's id, or the item's for an item without tasks. */
  key: string;
  /** Null for an item from before tasks, which is assigned as a whole. */
  task: {
    id: string;
    name: string;
    status: TaskStatus;
    dueDate: string | null;
    /** For a waiting task: the open task it waits on, and who has that. */
    waitingFor: { name: string; assigneeName: string | null } | null;
  } | null;
  item: {
    id: string;
    idea: string;
    goal: string;
    platforms: (typeof content.$inferSelect)["platforms"];
    type: (typeof content.$inferSelect)["type"];
    publishDate: string | null;
    goldenTime: string | null;
    status: ContentStatus;
    assetLinks: string[];
  };
};

/**
 * Everything `userId` has to do: their tasks, plus items from before tasks that are
 * assigned to them as a whole. Never proposals. Finished work only from the last 30 days.
 */
export async function listMyTasks(userId: string): Promise<MyTask[]> {
  const since = sql`now() - make_interval(days => ${DONE_DAYS})`;
  const [tasks, items] = await Promise.all([
    db
      .select({
        id: task.id,
        name: task.name,
        status: task.status,
        dueDate: task.dueDate,
        item: contentColumns,
      })
      .from(task)
      .innerJoin(content, eq(task.contentId, content.id))
      .where(
        and(
          eq(task.assigneeId, userId),
          ne(content.status, "proposed"),
          or(ne(task.status, "done"), gte(task.doneAt, since)),
        ),
      ),
    db
      .select(contentColumns)
      .from(content)
      .where(
        and(
          eq(content.assigneeId, userId),
          ne(content.status, "proposed"),
          notExists(
            db
              .select({ id: task.id })
              .from(task)
              .where(eq(task.contentId, content.id)),
          ),
          or(ne(content.status, "published"), gte(content.updatedAt, since)),
        ),
      ),
  ]);

  // What each waiting task waits on: the first unfinished task of its idea.
  const waitingIdeas = [
    ...new Set(
      tasks.filter((row) => row.status === "waiting").map((row) => row.item.id),
    ),
  ];
  const openByIdea = new Map<
    string,
    { name: string; assigneeName: string | null }
  >();
  if (waitingIdeas.length) {
    const ideaTasks = await db
      .select({
        contentId: task.contentId,
        name: task.name,
        status: task.status,
        assigneeName: user.name,
      })
      .from(task)
      .leftJoin(user, eq(task.assigneeId, user.id))
      .where(inArray(task.contentId, waitingIdeas))
      .orderBy(asc(task.position));
    for (const row of ideaTasks) {
      if (row.status === "done" || openByIdea.has(row.contentId)) continue;
      openByIdea.set(row.contentId, {
        name: row.name,
        assigneeName: row.assigneeName,
      });
    }
  }

  return [
    ...tasks.map((row) => ({
      key: row.id,
      task: {
        id: row.id,
        name: row.name,
        status: row.status,
        dueDate: row.dueDate,
        waitingFor:
          row.status === "waiting"
            ? (openByIdea.get(row.item.id) ?? null)
            : null,
      },
      item: row.item,
    })),
    ...items.map((item) => ({ key: item.id, task: null, item })),
  ];
}
