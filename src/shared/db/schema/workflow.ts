import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { content, contentStatus, contentType } from "./content";

/**
 * How an approved idea gets made: the kinds of work (work types), who does each,
 * and for each content type the steps in order. Approving an idea turns its steps
 * into tasks, one per step, each with an assignee and a due day.
 */

/** What an idea shows as while one of its tasks is the open one. */
export const IDEA_STATUSES_WHILE_OPEN = [
  "in_progress",
  "in_review",
  "scheduled",
] as const;

export type IdeaStatusWhileOpen = (typeof IDEA_STATUSES_WHILE_OPEN)[number];

/** A kind of work, such as Content prep or Publishing, in the order it happens. Names are the team's own, not translated. */
export const workType = pgTable("work_type", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  position: integer().notNull().default(0),
  /** One of IDEA_STATUSES_WHILE_OPEN. */
  ideaStatus: contentStatus().notNull().default("in_progress"),
  createdAt: timestamp().defaultNow().notNull(),
});

export type WorkType = typeof workType.$inferSelect;

/** Who can do which work. One member can do several. */
export const memberWorkType = pgTable(
  "member_work_type",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workTypeId: uuid()
      .notNull()
      .references(() => workType.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.workTypeId] })],
);

/**
 * One step of a content type's workflow: this type needs this work. Steps run in the
 * work types' order. Due days count back from the publish day.
 */
export const workflowStep = pgTable(
  "workflow_step",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentType: contentType().notNull(),
    workTypeId: uuid()
      .notNull()
      .references(() => workType.id, { onDelete: "cascade" }),
    daysBefore: integer().notNull().default(0),
  },
  (table) => [
    uniqueIndex("workflow_step_type_work_idx").on(
      table.contentType,
      table.workTypeId,
    ),
  ],
);

export type WorkflowStep = typeof workflowStep.$inferSelect;

export const TASK_STATUSES = [
  "waiting",
  "todo",
  "in_progress",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const taskStatus = pgEnum("task_status", TASK_STATUSES);

/** One step of one idea. Waiting until the step before it is done. */
export const task = pgTable(
  "task",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    // The work type's name and idea status are copied, so the task still reads after the type changes.
    workTypeId: uuid().references(() => workType.id, { onDelete: "set null" }),
    name: text().notNull(),
    ideaStatus: contentStatus().notNull(),
    position: integer().notNull(),
    daysBefore: integer().notNull().default(0),
    assigneeId: text().references(() => user.id, { onDelete: "set null" }),
    status: taskStatus().notNull().default("waiting"),
    dueDate: date({ mode: "string" }),
    doneAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_content_id_idx").on(table.contentId),
    index("task_assignee_id_idx").on(table.assigneeId),
  ],
);

export type Task = typeof task.$inferSelect;
