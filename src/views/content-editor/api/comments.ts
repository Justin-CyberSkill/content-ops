"use server";

import { and, eq, type SQL } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, contentComment } from "@/shared/db/schema";
import { createCommentSchema } from "../model/comment";

export type CommentActionState = { error?: string };

export async function addComment(
  contentId: string,
  body: string,
): Promise<CommentActionState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  const parsed = createCommentSchema((key) => t(key)).safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!z.uuid().safeParse(contentId).success) return { error: t("deleted") };

  const [item] = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.id, contentId));
  if (!item) return { error: t("deleted") };

  await db
    .insert(contentComment)
    .values({ contentId, authorId: me.id, body: parsed.data });
  refresh();
  return {};
}

/** Authors delete their own comments; admins delete any. */
export async function deleteComment(id: string): Promise<CommentActionState> {
  const me = await requireUser();
  if (!z.uuid().safeParse(id).success) return {};

  const conditions: SQL[] = [eq(contentComment.id, id)];
  if (me.role !== "admin") conditions.push(eq(contentComment.authorId, me.id));
  await db.delete(contentComment).where(and(...conditions));
  refresh();
  return {};
}
