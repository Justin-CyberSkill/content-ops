"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { asset, assetVersion, content } from "@/shared/db/schema";
import {
  createAssetSchema,
  createVersionSchema,
  readAssetForm,
} from "../model/asset";

export type AssetActionState = { error?: string; saved?: boolean };

/** Adds an asset with its first version. Anyone on the team can. */
export async function addAsset(
  contentId: string,
  _state: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(contentId).success) return { error: t("deleted") };
  const parsed = createAssetSchema((key) => t(key)).safeParse(
    readAssetForm(formData),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { label, platform, url, note } = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [item] = await tx
      .select({ platforms: content.platforms, status: content.status })
      .from(content)
      .where(eq(content.id, contentId));
    // Proposals aren't on the plan yet, so nothing is made for them.
    if (!item || item.status === "proposed") return { error: t("deleted") };
    if (platform && !item.platforms.includes(platform))
      return { error: t("assetPlatformGone") };
    const [row] = await tx
      .insert(asset)
      .values({ contentId, label, platform, createdById: me.id })
      .returning({ id: asset.id });
    await tx
      .insert(assetVersion)
      .values({ assetId: row.id, url, note, createdById: me.id });
    return { saved: true };
  });
  if (result.saved) refresh();
  return result;
}

/** Adds a newer version of an asset; it becomes the one everyone uses. */
export async function addAssetVersion(
  assetId: string,
  _state: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(assetId).success) return { error: t("assetGone") };
  const parsed = createVersionSchema((key) => t(key)).safeParse(
    readAssetForm(formData),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [row] = await db
    .select({ id: asset.id })
    .from(asset)
    .where(eq(asset.id, assetId));
  if (!row) return { error: t("assetGone") };
  await db
    .insert(assetVersion)
    .values({ assetId, ...parsed.data, createdById: me.id });
  refresh();
  return { saved: true };
}

/** Deletes an asset and its versions. Whoever added it, or an admin. */
export async function deleteAsset(assetId: string): Promise<AssetActionState> {
  const me = await requireUser();
  const t = await getTranslations("contentEditor.errors");
  if (!z.uuid().safeParse(assetId).success) return {};
  const [row] = await db
    .select({ createdById: asset.createdById })
    .from(asset)
    .where(eq(asset.id, assetId));
  if (!row) return {};
  if (me.role !== "admin" && row.createdById !== me.id)
    return { error: t("notYourAsset") };
  await db.delete(asset).where(eq(asset.id, assetId));
  refresh();
  return {};
}
