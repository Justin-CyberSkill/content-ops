import { sql } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Fixed lists. Add a value here, then run `pnpm db:generate` for the enum migration.
export const PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "x",
  "threads",
  "website",
] as const;

export const CONTENT_TYPES = [
  "motion_video",
  "short_video",
  "long_video",
  "live",
  "image",
  "carousel",
  "text_post",
  "quiz",
  "article",
] as const;

// "proposed" is for ideas waiting on approval, such as ones agents suggest.
export const CONTENT_STATUSES = [
  "proposed",
  "planned",
  "in_progress",
  "in_review",
  "scheduled",
  "published",
] as const;

/** Statuses people set on the plan. "proposed" is only set by agents and left by review. */
export const PLAN_STATUSES = [
  "planned",
  "in_progress",
  "in_review",
  "scheduled",
  "published",
] as const satisfies readonly (typeof CONTENT_STATUSES)[number][];

export type Platform = (typeof PLATFORMS)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const platform = pgEnum("platform", PLATFORMS);
export const contentType = pgEnum("content_type", CONTENT_TYPES);
export const contentStatus = pgEnum("content_status", CONTENT_STATUSES);

export const content = pgTable(
  "content",
  {
    id: uuid().primaryKey().defaultRandom(),
    goal: text().notNull(),
    idea: text().notNull(),
    platforms: platform().array().notNull().default(sql`'{}'`),
    type: contentType().notNull(),
    publishDate: date({ mode: "string" }),
    // Local time of day to publish, e.g. 19:30.
    goldenTime: time(),
    assigneeId: text().references(() => user.id, { onDelete: "set null" }),
    status: contentStatus().notNull().default("planned"),
    assetLinks: text().array().notNull().default(sql`'{}'`),
    createdById: text().references(() => user.id, { onDelete: "set null" }),
    // Set when an agent proposed it. The agent's key name is kept even if the key is deleted.
    proposedByKeyId: text(),
    proposedByName: text(),
    /** The agent's "why this". */
    proposalReason: text(),
    // A rejected proposal keeps status "proposed" and is hidden from the plan; agents read the reason.
    rejectedAt: timestamp(),
    rejectionReason: text(),
    reviewedById: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("content_assignee_id_idx").on(table.assigneeId),
    index("content_publish_date_idx").on(table.publishDate),
    index("content_proposed_by_key_id_idx").on(table.proposedByKeyId),
  ],
);

export type Content = typeof content.$inferSelect;

export const contentComment = pgTable(
  "content_comment",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    // Kept when the author is removed, so the thread still reads in order.
    authorId: text().references(() => user.id, { onDelete: "set null" }),
    body: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("content_comment_content_id_idx").on(table.contentId)],
);

export type ContentComment = typeof contentComment.$inferSelect;
