import { z } from "zod";
import { PLATFORMS } from "@/shared/db/schema";
import type { Messages } from "@/shared/i18n";

type ErrorKey = keyof Messages["contentEditor"]["errors"];

export const ASSET_LABEL_MAX_LENGTH = 60;
export const ASSET_NOTE_MAX_LENGTH = 500;

/** A link and what it's for: one version of an asset. */
export const createVersionSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    url: z
      .string()
      .trim()
      .pipe(z.url({ protocol: /^https?$/, error: t("assetLinkInvalid") })),
    note: z.string().trim().max(ASSET_NOTE_MAX_LENGTH, t("assetNoteTooLong")),
  });

/** A new asset and its first version. An empty platform means every platform. */
export const createAssetSchema = (t: (key: ErrorKey) => string) =>
  createVersionSchema(t).extend({
    label: z
      .string()
      .trim()
      .min(1, t("assetLabelRequired"))
      .max(ASSET_LABEL_MAX_LENGTH, t("assetLabelTooLong")),
    platform: z
      .union([z.literal(""), z.enum(PLATFORMS)], {
        error: t("assetPlatformGone"),
      })
      .transform((value) => value || null),
  });

export function readAssetForm(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    label: get("label"),
    platform: get("platform"),
    url: get("url"),
    note: get("note"),
  };
}
