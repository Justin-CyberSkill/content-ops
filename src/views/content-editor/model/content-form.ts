import { z } from "zod";
import {
  CONTENT_STATUSES,
  CONTENT_TYPES,
  type Content,
  PLATFORMS,
} from "@/shared/db/schema";
import type { Messages } from "@/shared/i18n";

type ErrorKey = keyof Messages["contentEditor"]["errors"];

// Empty inputs become null; anything else must pass `schema`.
const optional = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), schema]))
    .transform((value) => value || null);

/** `t` turns an error key into text, such as getTranslations("contentEditor.errors"). */
export const createContentFormSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    goal: z.string().trim().min(1, t("goalRequired")),
    idea: z.string().trim().min(1, t("ideaRequired")),
    platforms: z.array(z.enum(PLATFORMS)).min(1, t("platformsRequired")),
    type: z.enum(CONTENT_TYPES, { error: t("typeRequired") }),
    publishDate: optional(z.iso.date({ error: t("invalidDate") })),
    goldenTime: optional(z.iso.time({ error: t("invalidTime") })),
    assigneeId: optional(z.string()),
    status: z.enum(CONTENT_STATUSES),
    assetLinks: z
      .string()
      .transform((value) =>
        value
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.url({ protocol: /^https?$/, error: t("invalidLinks") }))),
  });

export type ContentFormData = z.output<
  ReturnType<typeof createContentFormSchema>
>;

/** What the form shows: strings for every field, so a failed submit can refill it. */
export type ContentFormValues = {
  goal: string;
  idea: string;
  platforms: string[];
  type: string;
  publishDate: string;
  goldenTime: string;
  assigneeId: string;
  status: string;
  assetLinks: string;
};

export const emptyContentForm: ContentFormValues = {
  goal: "",
  idea: "",
  platforms: [],
  type: "",
  publishDate: "",
  goldenTime: "",
  assigneeId: "",
  status: "planned",
  assetLinks: "",
};

export function toFormValues(item: Content): ContentFormValues {
  return {
    goal: item.goal,
    idea: item.idea,
    platforms: item.platforms,
    type: item.type,
    publishDate: item.publishDate ?? "",
    goldenTime: item.goldenTime?.slice(0, 5) ?? "",
    assigneeId: item.assigneeId ?? "",
    status: item.status,
    assetLinks: item.assetLinks.join("\n"),
  };
}

export function readContentForm(formData: FormData): ContentFormValues {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    goal: get("goal"),
    idea: get("idea"),
    platforms: formData.getAll("platforms").map(String),
    type: get("type"),
    publishDate: get("publishDate"),
    goldenTime: get("goldenTime"),
    assigneeId: get("assigneeId"),
    status: get("status"),
    assetLinks: get("assetLinks"),
  };
}
