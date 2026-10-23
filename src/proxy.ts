import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
// Not "@/shared/i18n": its navigation helpers pull in request.ts, which proxy can't load.
import { isLocale } from "@/shared/i18n/config";
import { routing } from "@/shared/i18n/routing";

const intl = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, locale, page] = pathname.split("/");

  // Optimistic check only: a cookie exists. Pages and actions still verify the session.
  if (isLocale(locale) && page !== "sign-in" && !getSessionCookie(request)) {
    const url = new URL(`/${locale}/sign-in`, request.url);
    // Without the language, so the page opens in whatever language sign-in ends in.
    if (page)
      url.searchParams.set("next", pathname.slice(locale.length + 1) + search);
    return NextResponse.redirect(url);
  }

  // Vietnamese unless the user picked English before: ignore the browser's language.
  const headers = new Headers(request.headers);
  headers.delete("accept-language");
  return intl(new NextRequest(request, { headers }));
}

export const config = {
  // Everything but API routes, Next.js internals and files such as favicon.ico.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
