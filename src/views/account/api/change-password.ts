"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { auth, requireUser } from "@/shared/auth/index.server";
import type { Messages } from "@/shared/i18n";

export type ChangePasswordState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done" };

type ErrorKey = keyof Messages["account"]["errors"];

const createSchema = (t: (key: ErrorKey) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t("currentRequired")),
      newPassword: z.string().min(8, t("tooShort")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("mismatch"),
    });

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await requireUser();
  const t = await getTranslations("account.errors");
  const parsed = createSchema((key) => t(key)).safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError)
      return { status: "error", message: t("wrongCurrent") };
    throw error;
  }
  return { status: "done" };
}
