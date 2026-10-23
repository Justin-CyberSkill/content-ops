import type { ContentStatus, ContentType, Platform } from "@/shared/db/schema";

export const platformLabels: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  threads: "Threads",
  website: "Website",
};

export const contentTypeLabels: Record<ContentType, string> = {
  motion_video: "Motion video",
  short_video: "Short video",
  long_video: "Long video",
  live: "Live",
  image: "Image",
  carousel: "Carousel",
  text_post: "Text post",
  quiz: "Quiz",
  article: "Article",
};

export const statusLabels: Record<ContentStatus, string> = {
  proposed: "Proposed",
  planned: "Planned",
  in_progress: "In progress",
  in_review: "In review",
  scheduled: "Scheduled",
  published: "Published",
};
