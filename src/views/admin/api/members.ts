"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ROLES } from "@/shared/auth";
import { auth, requireAdmin } from "@/shared/auth/index.server";
import type { Messages } from "@/shared/i18n";
import { temporaryPassword } from "../lib/temporary-password";

export type MemberActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; email: string; password: string };

type ErrorKey = keyof Messages["admin"]["errors"];

const createSchema = (t: (key: ErrorKey) => string) =>
  z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(t("invalidEmail"))),
    role: z.enum(ROLES),
  });

export async function createMember(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  await requireAdmin();
  const t = await getTranslations("admin.errors");
  const parsed = createSchema((key) => t(key)).safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const password = temporaryPassword();
  try {
    await auth.api.createUser({
      body: { ...parsed.data, password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError)
      return { status: "error", message: error.message };
    throw error;
  }
  refresh();
  return { status: "done", email: parsed.data.email, password };
}

export async function resetMemberPassword(
  userId: string,
  email: string,
): Promise<MemberActionState> {
  await requireAdmin();
  const password = temporaryPassword();
  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword: password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError)
      return { status: "error", message: error.message };
    throw error;
  }
  return { status: "done", email, password };
}
