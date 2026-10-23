import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db";
import { content, contentComment, user } from "@/shared/db/schema";

export async function getContent(id: string) {
  if (!z.uuid().safeParse(id).success) return undefined;
  return db.query.content.findFirst({ where: eq(content.id, id) });
}

export type Member = { id: string; name: string };

export async function listMembers(): Promise<Member[]> {
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(asc(user.name));
}

export type Comment = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string | null;
  /** Null when the author's account was removed. */
  authorName: string | null;
};

/** Oldest first, so the thread reads top to bottom. */
export async function listComments(contentId: string): Promise<Comment[]> {
  return db
    .select({
      id: contentComment.id,
      body: contentComment.body,
      createdAt: contentComment.createdAt,
      authorId: contentComment.authorId,
      authorName: user.name,
    })
    .from(contentComment)
    .leftJoin(user, eq(contentComment.authorId, user.id))
    .where(eq(contentComment.contentId, contentId))
    .orderBy(asc(contentComment.createdAt), asc(contentComment.id));
}
