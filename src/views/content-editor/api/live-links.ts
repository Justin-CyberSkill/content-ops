"use server";

import { asc, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { taskKind } from "@/entities/task";
import { syncIdea } from "@/entities/task/index.server";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content, PLATFORMS, post, task } from "@/shared/db/schema";
import { publishProgress } from "../model/live-links";

export type LiveLinkState = { error?: string; saved?: boolean };

/**
 * Saves where a post went live, or clears it. Whoever has the publishing task, or an
 * admin. The first link starts the task; a link for every platform finishes it, so
 * the idea shows as Published. Clearing a link later doesn't reopen it.
 */
export async function saveLiveLink(
  contentId: string,
  platform: string,
  url: string,
): Promise<LiveLinkState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  const parsed = z
    .object({
      contentId: z.uuid({ error: t("deleted") }),
      platform: z.enum(PLATFORMS, { error: t("platformGone") }),
      url: z
        .string()
        .trim()
        .pipe(
          z.union([
            z.literal(""),
            z.url({ protocol: /^https?$/, error: t("liveLinkInvalid") }),
          ]),
        )
        .transform((value) => value || null),
    })
    .safeParse({ contentId, platform, url });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [item] = await tx
      .select({ platforms: content.platforms })
      .from(content)
      .where(eq(content.id, input.contentId))
      .for("update");
    if (!item) return { error: t("deleted") };
    if (!item.platforms.includes(input.platform))
      return { error: t("platformGone") };
    const tasks = await tx
      .select({
        id: task.id,
        status: task.status,
        ideaStatus: task.ideaStatus,
        assigneeId: task.assigneeId,
      })
      .from(task)
      .where(eq(task.contentId, input.contentId))
      .orderBy(asc(task.position));
    const publishing = tasks.filter(
      (row) => taskKind(row.ideaStatus) === "publish",
    );
    // The open one if there is one, otherwise the last, which is done.
    const publish =
      publishing.find((row) => row.status !== "done") ?? publishing.at(-1);
    if (!publish || publish.status === "waiting")
      return { error: t("publishingNotOpen") };
    if (me.role !== "admin" && publish.assigneeId !== me.id)
      return { error: t("notYourPublishing") };

    const live = {
      liveUrl: input.url,
      publishedAt: input.url ? new Date() : null,
      publishedById: input.url ? me.id : null,
    };
    await tx
      .insert(post)
      .values({ contentId: input.contentId, platform: input.platform, ...live })
      .onConflictDoUpdate({
        target: [post.contentId, post.platform],
        set: live,
      });

    const links = await tx
      .select({ platform: post.platform, liveUrl: post.liveUrl })
      .from(post)
      .where(eq(post.contentId, input.contentId));
    const next = publishProgress(publish.status, item.platforms, links);
    if (next !== publish.status) {
      await tx
        .update(task)
        .set({ status: next, doneAt: next === "done" ? new Date() : null })
        .where(eq(task.id, publish.id));
      await syncIdea(tx, input.contentId);
    }
    return { saved: true };
  });
  if (result.saved) refresh();
  return result;
}
