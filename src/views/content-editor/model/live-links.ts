import type { Platform, TaskStatus } from "@/shared/db/schema";

/** How many of the idea's platforms have a live link. */
export function liveCount(
  platforms: Platform[],
  links: { platform: Platform; liveUrl: string | null }[],
): number {
  return platforms.filter((platform) =>
    links.some((link) => link.platform === platform && link.liveUrl),
  ).length;
}

/**
 * Where the publishing task stands after a live link changes: To do moves to In
 * progress with the first link, and an open task is done once every platform has one.
 * A done task stays done.
 */
export function publishProgress(
  status: TaskStatus,
  platforms: Platform[],
  links: { platform: Platform; liveUrl: string | null }[],
): TaskStatus {
  if (status === "done" || status === "waiting") return status;
  const live = liveCount(platforms, links);
  if (platforms.length && live === platforms.length) return "done";
  if (live > 0 && status === "todo") return "in_progress";
  return status;
}
