import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { content, platform } from "./content";

/**
 * What an idea's tasks make: the caption for each platform and, once it's out, the
 * post's live link; the assets, each with its versions; and each review's verdict.
 */

/** One platform's post for an idea: what goes with it, then where it went live. */
export const post = pgTable(
  "post",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    platform: platform().notNull(),
    caption: text().notNull().default(""),
    hashtags: text().notNull().default(""),
    pinnedComment: text().notNull().default(""),
    /** When the caption, hashtags or pinned comment last changed, for "changed since last review". */
    copyUpdatedAt: timestamp(),
    copyUpdatedById: text().references(() => user.id, { onDelete: "set null" }),
    liveUrl: text(),
    publishedAt: timestamp(),
    publishedById: text().references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("post_content_platform_idx").on(
      table.contentId,
      table.platform,
    ),
  ],
);

export type Post = typeof post.$inferSelect;

/** Something made for an idea, such as the video or thumbnail. A link, not an upload. */
export const asset = pgTable(
  "asset",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    label: text().notNull(),
    /** Null when it's for every platform. */
    platform: platform(),
    createdById: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("asset_content_id_idx").on(table.contentId)],
);

export type Asset = typeof asset.$inferSelect;

/** One version of an asset. The newest is the one to use; numbers follow the order they were added. */
export const assetVersion = pgTable(
  "asset_version",
  {
    id: uuid().primaryKey().defaultRandom(),
    assetId: uuid()
      .notNull()
      .references(() => asset.id, { onDelete: "cascade" }),
    url: text().notNull(),
    note: text().notNull().default(""),
    createdById: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("asset_version_asset_id_idx").on(table.assetId)],
);

export const REVIEW_VERDICTS = ["approved", "changes_requested"] as const;

export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

export const reviewVerdict = pgEnum("review_verdict", REVIEW_VERDICTS);

/** A review task's outcome. Asking for changes sends the tasks it names back to To do. */
export const review = pgTable(
  "review",
  {
    id: uuid().primaryKey().defaultRandom(),
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    verdict: reviewVerdict().notNull(),
    note: text().notNull().default(""),
    /** The names of the tasks sent back, so the history still reads after the tasks change. */
    reopenedTasks: text().array().notNull().default(sql`'{}'`),
    reviewerId: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [index("review_content_id_idx").on(table.contentId)],
);

export type Review = typeof review.$inferSelect;
