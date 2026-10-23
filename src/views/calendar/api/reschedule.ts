"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { content } from "@/shared/db/schema";

const schema = z.object({
  id: z.uuid(),
  publishDate: z.iso.date(),
  goldenTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
});

/** Admins move an item by dragging it on the calendar. */
export async function rescheduleContent(
  id: string,
  publishDate: string,
  goldenTime: string | null,
): Promise<{ error?: string }> {
  await requireAdmin();
  const t = await getTranslations("calendar.errors");
  const parsed = schema.safeParse({ id, publishDate, goldenTime });
  if (!parsed.success) return { error: t("invalidSchedule") };

  const updated = await db
    .update(content)
    .set({
      publishDate: parsed.data.publishDate,
      goldenTime: parsed.data.goldenTime,
    })
    .where(eq(content.id, parsed.data.id))
    .returning({ id: content.id });
  if (!updated.length) return { error: t("deleted") };

  refresh();
  return {};
}
