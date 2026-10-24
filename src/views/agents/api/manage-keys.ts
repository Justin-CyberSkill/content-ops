"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { auth, requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { apikey } from "@/shared/db/schema";

export type CreateKeyState = { error?: string; key?: string; name?: string };

/** The key is shown once, here; only its hash is stored. */
export async function createAgentKey(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const me = await requireAdmin();
  const t = await getTranslations("agents.errors");
  const name = z
    .string()
    .trim()
    .min(1, t("nameRequired"))
    .max(40, t("nameTooLong"))
    .safeParse(String(formData.get("name") ?? ""));
  if (!name.success) return { error: name.error.issues[0].message };

  const created = await auth.api.createApiKey({
    body: { name: name.data, userId: me.id },
  });
  refresh();
  return { key: created.key, name: name.data };
}

export async function setAgentKeyEnabled(id: string, enabled: boolean) {
  await requireAdmin();
  if (!z.string().min(1).safeParse(id).success) return;
  await db.update(apikey).set({ enabled }).where(eq(apikey.id, id));
  refresh();
}

/** Its proposals stay, still named after the key. */
export async function deleteAgentKey(id: string) {
  await requireAdmin();
  if (!z.string().min(1).safeParse(id).success) return;
  await db.delete(apikey).where(eq(apikey.id, id));
  refresh();
}
