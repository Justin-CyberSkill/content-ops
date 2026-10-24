import { z } from "zod";
import { PLATFORMS, type Platform } from "@/shared/db/schema";
import type { Messages } from "@/shared/i18n";

type ErrorKey = keyof Messages["contentEditor"]["errors"];

export const SCRIPT_MAX_LENGTH = 20_000;
const CAPTION_MAX_LENGTH = 10_000;
const HASHTAGS_MAX_LENGTH = 1_000;
const PINNED_MAX_LENGTH = 2_000;

/**
 * How long a post can be on each platform, caption and hashtags together, as the
 * platforms set them in 2026. Facebook and websites have no limit worth showing.
 */
export const CAPTION_LIMITS: Partial<Record<Platform, number>> = {
  x: 280,
  threads: 500,
  instagram: 2_200,
  linkedin: 3_000,
  tiktok: 4_000,
  youtube: 5_000,
};

/** What goes into the post box: the caption, then the hashtags after a blank line. */
export function postText(caption: string, hashtags: string): string {
  return [caption.trim(), hashtags.trim()].filter(Boolean).join("\n\n");
}

/** Characters as people count them, so an emoji is one. */
export const characterCount = (text: string) => [...text].length;

/** "cyber, #skill  learn" becomes "#cyber #skill #learn". */
export function normalizeHashtags(value: string): string {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

/** Form field names per platform, such as `caption:facebook`. */
export const captionField = (
  field: "caption" | "hashtags" | "pinnedComment",
  platform: Platform,
) => `${field}:${platform}`;

export const createCaptionsSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    script: z.string().trim().max(SCRIPT_MAX_LENGTH, t("scriptTooLong")),
    posts: z.array(
      z.object({
        platform: z.enum(PLATFORMS),
        caption: z.string().trim().max(CAPTION_MAX_LENGTH, t("captionTooLong")),
        hashtags: z
          .string()
          .max(HASHTAGS_MAX_LENGTH, t("hashtagsTooLong"))
          .transform(normalizeHashtags),
        pinnedComment: z
          .string()
          .trim()
          .max(PINNED_MAX_LENGTH, t("pinnedCommentTooLong")),
      }),
    ),
  });

/** The script and each platform's fields, as the form sends them. */
export function readCaptionsForm(formData: FormData, platforms: Platform[]) {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    script: get("script"),
    posts: platforms.map((platform) => ({
      platform,
      caption: get(captionField("caption", platform)),
      hashtags: get(captionField("hashtags", platform)),
      pinnedComment: get(captionField("pinnedComment", platform)),
    })),
  };
}
