/**
 * The list an item was opened from. The item page goes back there, and the sidebar
 * keeps that list highlighted, so opening an item never feels like changing section.
 */
export const CONTENT_ORIGINS = {
  plan: "/content",
  tasks: "/my-tasks",
  review: "/review",
} as const;

export type ContentOrigin = keyof typeof CONTENT_ORIGINS;

/** Anything else, such as a pasted link, falls back to the content plan. */
export function parseOrigin(value: unknown): ContentOrigin {
  return typeof value === "string" && Object.hasOwn(CONTENT_ORIGINS, value)
    ? (value as ContentOrigin)
    : "plan";
}

/** The item opens under its list, such as /my-tasks/[id], so the path says where you are. */
export function contentHref(id: string, from: ContentOrigin) {
  return `${CONTENT_ORIGINS[from]}/${id}`;
}

export function originHref(from: ContentOrigin) {
  return CONTENT_ORIGINS[from];
}
