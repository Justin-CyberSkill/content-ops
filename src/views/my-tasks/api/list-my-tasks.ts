import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNotNull,
  ne,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { type TaskKind, taskKind } from "@/entities/task";
import { db } from "@/shared/db";
import {
  type ContentStatus,
  content,
  type Platform,
  post,
  review,
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
    kind: TaskKind;
    /** What a review asked for when it sent the task back, until it's done again. */
    changesRequested: { note: string; by: string | null } | null;
    /** For publishing: the platforms that already have a live link. */
    live: Platform[];
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
  const reviewer = alias(user, "reviewer");
  const [tasks, items] = await Promise.all([
    db
      .select({
        id: task.id,
        name: task.name,
        status: task.status,
        dueDate: task.dueDate,
        ideaStatus: task.ideaStatus,
        reopenNote: review.note,
        reopenedByName: reviewer.name,
        item: contentColumns,
      })
      .from(task)
      .innerJoin(content, eq(task.contentId, content.id))
      .leftJoin(review, eq(task.reopenedByReviewId, review.id))
      .leftJoin(reviewer, eq(review.reviewerId, reviewer.id))
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

  // Which platforms each publishing task already has a live link for.
  const publishIdeas = [
    ...new Set(
      tasks
        .filter((row) => taskKind(row.ideaStatus) === "publish")
        .map((row) => row.item.id),
    ),
  ];
  const liveByIdea = new Map<string, Platform[]>();
  if (publishIdeas.length) {
    const links = await db
      .select({ contentId: post.contentId, platform: post.platform })
      .from(post)
      .where(
        and(inArray(post.contentId, publishIdeas), isNotNull(post.liveUrl)),
      );
    for (const link of links)
      liveByIdea.set(link.contentId, [
        ...(liveByIdea.get(link.contentId) ?? []),
        link.platform,
      ]);
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
        kind: taskKind(row.ideaStatus),
        changesRequested:
          row.reopenNote !== null && row.status !== "done"
            ? { note: row.reopenNote, by: row.reopenedByName }
            : null,
        live: (liveByIdea.get(row.item.id) ?? []).filter((platform) =>
          row.item.platforms.includes(platform),
        ),
      },
      item: row.item,
    })),
    ...items.map((item) => ({ key: item.id, task: null, item })),
  ];
}
