"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { auth } from "@/shared/auth/index.server";
import { redirect } from "@/shared/i18n";
import { safeNext } from "../lib/safe-next";

export type SignInState = { error?: string; email?: string };

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const t = await getTranslations("signIn.errors");
  const email = String(formData.get("email") ?? "");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("missing"), email };

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) return { error: t("wrong"), email };
    throw error;
  }
  return redirect({
    href: safeNext(parsed.data.next),
    locale: await getLocale(),
  });
}
