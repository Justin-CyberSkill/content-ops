"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/shared/auth/index.server";
import { redirect } from "@/shared/i18n";

/** Ends the session and opens sign-in in the language you were using. */
export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect({ href: "/sign-in", locale: await getLocale() });
}
