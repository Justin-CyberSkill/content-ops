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

export type Platform = (typeof PLATFORMS)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

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
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("content_assignee_id_idx").on(table.assigneeId),
    index("content_publish_date_idx").on(table.publishDate),
  ],
);

export type Content = typeof content.$inferSelect;
