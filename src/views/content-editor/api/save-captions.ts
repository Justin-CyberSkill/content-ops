"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, post } from "@/shared/db/schema";
import { createCaptionsSchema, readCaptionsForm } from "../model/captions";

export type SaveCaptionsState = { error?: string; saved?: boolean };

/**
 * Saves the script and each platform's caption, hashtags and pinned comment. Anyone
 * on the team can. Only what changed gets a new time, so a review can say what's new.
 */
export async function saveCaptions(
  contentId: string,
  _state: SaveCaptionsState,
  formData: FormData,
): Promise<SaveCaptionsState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(contentId).success) return { error: t("deleted") };

  const result = await db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        script: content.script,
        platforms: content.platforms,
        status: content.status,
      })
      .from(content)
      .where(eq(content.id, contentId))
      .for("update");
    // Proposals aren't on the plan yet, so nothing is made for them.
    if (!item || item.status === "proposed") return { error: t("deleted") };
    const parsed = createCaptionsSchema((key) => t(key)).safeParse(
      readCaptionsForm(formData, item.platforms),
    );
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const now = new Date();
    if (parsed.data.script !== item.script)
      await tx
        .update(content)
        .set({ script: parsed.data.script, scriptUpdatedAt: now })
        .where(eq(content.id, contentId));

    const saved = await tx
      .select({
        platform: post.platform,
        caption: post.caption,
        hashtags: post.hashtags,
        pinnedComment: post.pinnedComment,
      })
      .from(post)
      .where(eq(post.contentId, contentId));
    for (const next of parsed.data.posts) {
      const current = saved.find((row) => row.platform === next.platform);
      const unchanged = current
        ? current.caption === next.caption &&
          current.hashtags === next.hashtags &&
          current.pinnedComment === next.pinnedComment
        : !next.caption && !next.hashtags && !next.pinnedComment;
      if (unchanged) continue;
      const copy = {
        caption: next.caption,
        hashtags: next.hashtags,
        pinnedComment: next.pinnedComment,
        copyUpdatedAt: now,
        copyUpdatedById: me.id,
      };
      if (current)
        await tx
          .update(post)
          .set(copy)
          .where(
            and(
              eq(post.contentId, contentId),
              eq(post.platform, next.platform),
            ),
          );
      else
        await tx
          .insert(post)
          .values({ contentId, platform: next.platform, ...copy })
          .onConflictDoUpdate({
            target: [post.contentId, post.platform],
            set: copy,
          });
    }
    return { saved: true };
  });
  if (result.saved) refresh();
  return result;
}
