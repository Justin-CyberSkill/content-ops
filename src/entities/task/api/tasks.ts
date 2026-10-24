import { asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import {
  CONTENT_TYPES,
  type ContentType,
  content,
  memberWorkType,
  type TaskStatus,
  task,
  user,
  workflowStep,
  workType,
} from "@/shared/db/schema";
import {
  advanceTasks,
  type Candidate,
  dueDate,
  ideaProgress,
  suggestAssignees,
} from "../model/task-flow";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Db = Tx | typeof db;

/** An idea's tasks in order, with who has each and who else does that kind of work. */
export async function listTasks(contentId: string, conn: Db = db) {
  const tasks = await conn
    .select({
      id: task.id,
      workTypeId: task.workTypeId,
      name: task.name,
      position: task.position,
      status: task.status,
      ideaStatus: task.ideaStatus,
      assigneeId: task.assigneeId,
      assigneeName: user.name,
      dueDate: task.dueDate,
      daysBefore: task.daysBefore,
      doneAt: task.doneAt,
    })
    .from(task)
    .leftJoin(user, eq(task.assigneeId, user.id))
    .where(eq(task.contentId, contentId))
    .orderBy(asc(task.position));
  const workTypeIds = [
    ...new Set(
      tasks.flatMap((row) => (row.workTypeId ? [row.workTypeId] : [])),
    ),
  ];
  const doers = await listCandidates(workTypeIds, conn);
  return tasks.map((row) => ({
    ...row,
    doers: (row.workTypeId ? (doers.get(row.workTypeId) ?? []) : []).map(
      ({ id, name }) => ({ id, name }),
    ),
  }));
}

export type IdeaTask = Awaited<ReturnType<typeof listTasks>>[number];

/**
 * Opens the next task, puts later ones back to waiting, and sets the idea's status and
 * owner from its tasks. Call after any change to an idea's tasks. No tasks, no change.
 */
export async function syncIdea(tx: Tx, contentId: string) {
  const tasks = await tx
    .select({
      id: task.id,
      position: task.position,
      status: task.status,
      ideaStatus: task.ideaStatus,
      assigneeId: task.assigneeId,
    })
    .from(task)
    .where(eq(task.contentId, contentId))
    .for("update");
  if (!tasks.length) return;

  for (const change of advanceTasks(tasks)) {
    await tx
      .update(task)
      .set({ status: change.status })
      .where(eq(task.id, change.id));
    const row = tasks.find((t) => t.id === change.id);
    if (row) row.status = change.status;
  }
  await tx
    .update(content)
    .set(ideaProgress(tasks))
    .where(eq(content.id, contentId));
}

/** Steps in the order the work happens, for one content type or all of them. */
async function listSteps(contentType: ContentType | null, conn: Db) {
  return conn
    .select({
      id: workflowStep.id,
      contentType: workflowStep.contentType,
      workTypeId: workflowStep.workTypeId,
      name: workType.name,
      ideaStatus: workType.ideaStatus,
      daysBefore: workflowStep.daysBefore,
    })
    .from(workflowStep)
    .innerJoin(workType, eq(workflowStep.workTypeId, workType.id))
    .where(contentType ? eq(workflowStep.contentType, contentType) : undefined)
    .orderBy(asc(workType.position), asc(workType.createdAt));
}

/**
 * Members who do each work type, with how many open tasks they have and when they
 * last got one, for suggesting who takes a step.
 */
async function listCandidates(workTypeIds: string[], conn: Db) {
  const byWorkType = new Map<string, Candidate[]>();
  if (!workTypeIds.length) return byWorkType;
  const [skills, loads] = await Promise.all([
    conn
      .select({
        workTypeId: memberWorkType.workTypeId,
        id: user.id,
        name: user.name,
      })
      .from(memberWorkType)
      .innerJoin(user, eq(memberWorkType.userId, user.id))
      .where(inArray(memberWorkType.workTypeId, workTypeIds))
      .orderBy(asc(user.name)),
    conn
      .select({
        assigneeId: task.assigneeId,
        open: sql<number>`count(*) filter (where ${task.status} <> 'done')`.mapWith(
          Number,
        ),
        lastAssignedAt: sql<Date | null>`max(${task.createdAt})`.mapWith(
          task.createdAt,
        ),
      })
      .from(task)
      .groupBy(task.assigneeId),
  ]);
  const loadOf = new Map(loads.map((row) => [row.assigneeId, row]));
  for (const skill of skills) {
    const load = loadOf.get(skill.id);
    const list = byWorkType.get(skill.workTypeId) ?? [];
    list.push({
      id: skill.id,
      name: skill.name,
      load: load?.open ?? 0,
      lastAssignedAt: load?.lastAssignedAt ?? null,
    });
    byWorkType.set(skill.workTypeId, list);
  }
  return byWorkType;
}

/** Who takes each step, by step id; null leaves it unassigned. A step left out gets the suggestion. */
export type Assignments = Map<string, string | null>;

/** Turns a new or approved idea's steps into tasks. Content types without steps get none. */
export async function createTasks(
  tx: Tx,
  idea: {
    id: string;
    type: ContentType;
    publishDate: string | null;
  },
  assignments: Assignments,
) {
  const steps = await listSteps(idea.type, tx);
  if (!steps.length) return;
  const [people, candidates] = await Promise.all([
    tx
      .select({ id: user.id })
      .from(user)
      .then((rows) => new Set(rows.map((row) => row.id))),
    listCandidates(
      steps.map((step) => step.workTypeId),
      tx,
    ),
  ]);
  const suggested = suggestAssignees(steps, candidates);
  await tx.insert(task).values(
    steps.map((step, position) => {
      const assigneeId = assignments.has(step.id)
        ? assignments.get(step.id)
        : suggested.get(step.id);
      return {
        contentId: idea.id,
        workTypeId: step.workTypeId,
        name: step.name,
        ideaStatus: step.ideaStatus,
        position,
        daysBefore: step.daysBefore,
        assigneeId: assigneeId && people.has(assigneeId) ? assigneeId : null,
        dueDate: dueDate(idea.publishDate, step.daysBefore),
      };
    }),
  );
  await syncIdea(tx, idea.id);
}

/** Moves every due day along with a new publish day. */
export async function moveDueDates(
  tx: Tx,
  contentId: string,
  publishDate: string | null,
) {
  const tasks = await tx
    .select({ id: task.id, daysBefore: task.daysBefore })
    .from(task)
    .where(eq(task.contentId, contentId));
  for (const row of tasks) {
    await tx
      .update(task)
      .set({ dueDate: dueDate(publishDate, row.daysBefore) })
      .where(eq(task.id, row.id));
  }
}

export async function hasTasks(contentId: string, conn: Db = db) {
  const [row] = await conn
    .select({ n: count() })
    .from(task)
    .where(eq(task.contentId, contentId));
  return (row?.n ?? 0) > 0;
}

export type TaskChangeError = "notFound" | "notYours" | "waiting";

/**
 * Sets a task's status. The assignee or an admin can; a waiting task can't change
 * until the one before it is done. The idea's status follows.
 */
export async function setTaskStatus(
  taskId: string,
  status: Exclude<TaskStatus, "waiting">,
  actor: { id: string; isAdmin: boolean },
): Promise<{ error?: TaskChangeError; contentId?: string }> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        contentId: task.contentId,
        assigneeId: task.assigneeId,
        status: task.status,
      })
      .from(task)
      .where(eq(task.id, taskId))
      .for("update");
    if (!row) return { error: "notFound" as const };
    if (!actor.isAdmin && row.assigneeId !== actor.id)
      return { error: "notYours" as const };
    if (row.status === "waiting") return { error: "waiting" as const };
    if (row.status !== status) {
      await tx
        .update(task)
        .set({ status, doneAt: status === "done" ? new Date() : null })
        .where(eq(task.id, taskId));
      await syncIdea(tx, row.contentId);
    }
    return { contentId: row.contentId };
  });
}

/** Gives a task to someone else, or no one. Admins only; the caller checks. */
export async function setTaskAssignee(
  taskId: string,
  assigneeId: string | null,
): Promise<{ error?: "notFound" | "memberGone" }> {
  return db.transaction(async (tx) => {
    if (assigneeId) {
      const [member] = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, assigneeId));
      if (!member) return { error: "memberGone" as const };
    }
    const [row] = await tx
      .update(task)
      .set({ assigneeId })
      .where(eq(task.id, taskId))
      .returning({ contentId: task.contentId });
    if (!row) return { error: "notFound" as const };
    await syncIdea(tx, row.contentId);
    return {};
  });
}

export type PlannedStep = {
  id: string;
  name: string;
  daysBefore: number;
  /** Members who do this work, fewest open tasks first. */
  candidates: { id: string; name: string; load: number }[];
  suggestedId: string | null;
};

export type WorkPlan = Record<ContentType, PlannedStep[]>;

/**
 * The steps each content type gets, each with who could do it and who to suggest,
 * for choosing who does what when an idea is approved or added.
 */
export async function planWork(): Promise<WorkPlan> {
  const steps = await listSteps(null, db);
  const candidates = await listCandidates(
    [...new Set(steps.map((step) => step.workTypeId))],
    db,
  );
  const plan = Object.fromEntries(
    CONTENT_TYPES.map((type) => [type, [] as PlannedStep[]]),
  ) as WorkPlan;
  for (const type of CONTENT_TYPES) {
    const typeSteps = steps.filter((step) => step.contentType === type);
    const suggested = suggestAssignees(typeSteps, candidates);
    plan[type] = typeSteps.map((step) => ({
      id: step.id,
      name: step.name,
      daysBefore: step.daysBefore,
      candidates: [...(candidates.get(step.workTypeId) ?? [])]
        .sort((a, b) => a.load - b.load || a.name.localeCompare(b.name))
        .map(({ id, name, load }) => ({ id, name, load })),
      suggestedId: suggested.get(step.id) ?? null,
    }));
  }
  return plan;
}
