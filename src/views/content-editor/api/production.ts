import { asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/shared/db";
import {
  asset,
  assetVersion,
  type Platform,
  post,
  type ReviewVerdict,
  review,
  user,
} from "@/shared/db/schema";

/** Each platform's caption and live link that has been written so far. */
export async function listPosts(contentId: string) {
  const publisher = alias(user, "publisher");
  return db
    .select({
      platform: post.platform,
      caption: post.caption,
      hashtags: post.hashtags,
      pinnedComment: post.pinnedComment,
      copyUpdatedAt: post.copyUpdatedAt,
      liveUrl: post.liveUrl,
      publishedAt: post.publishedAt,
      publishedByName: publisher.name,
    })
    .from(post)
    .leftJoin(publisher, eq(post.publishedById, publisher.id))
    .where(eq(post.contentId, contentId));
}

export type PostRow = Awaited<ReturnType<typeof listPosts>>[number];

export type AssetVersionRow = {
  id: string;
  url: string;
  note: string;
  createdAt: Date;
  createdByName: string | null;
};

export type AssetRow = {
  id: string;
  label: string;
  platform: Platform | null;
  createdById: string | null;
  createdAt: Date;
  /** Oldest first; the last one is the one to use. */
  versions: AssetVersionRow[];
};

/** The idea's assets in the order they were added, each with its versions. */
export async function listAssets(contentId: string): Promise<AssetRow[]> {
  const assets = await db
    .select({
      id: asset.id,
      label: asset.label,
      platform: asset.platform,
      createdById: asset.createdById,
      createdAt: asset.createdAt,
    })
    .from(asset)
    .where(eq(asset.contentId, contentId))
    .orderBy(asc(asset.createdAt), asc(asset.id));
  if (!assets.length) return [];
  const versions = await db
    .select({
      id: assetVersion.id,
      assetId: assetVersion.assetId,
      url: assetVersion.url,
      note: assetVersion.note,
      createdAt: assetVersion.createdAt,
      createdByName: user.name,
    })
    .from(assetVersion)
    .leftJoin(user, eq(assetVersion.createdById, user.id))
    .where(
      inArray(
        assetVersion.assetId,
        assets.map((row) => row.id),
      ),
    )
    .orderBy(asc(assetVersion.createdAt), asc(assetVersion.id));
  return assets.map((row) => ({
    ...row,
    versions: versions
      .filter((version) => version.assetId === row.id)
      .map(({ assetId: _, ...version }) => version),
  }));
}

export type ReviewRow = {
  id: string;
  verdict: ReviewVerdict;
  note: string;
  reopenedTasks: string[];
  reviewerName: string | null;
  createdAt: Date;
};

/** Every review of the idea, newest first. */
export async function listReviews(contentId: string): Promise<ReviewRow[]> {
  return db
    .select({
      id: review.id,
      verdict: review.verdict,
      note: review.note,
      reopenedTasks: review.reopenedTasks,
      reviewerName: user.name,
      createdAt: review.createdAt,
    })
    .from(review)
    .leftJoin(user, eq(review.reviewerId, user.id))
    .where(eq(review.contentId, contentId))
    .orderBy(desc(review.createdAt), desc(review.id));
}
