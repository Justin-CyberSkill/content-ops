import { cookies } from "next/headers";
import { locale as rootLocale } from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "./config";

/** The [locale] segment; Server Actions can't read it, so they fall back to the cookie proxy.ts keeps in step. */
async function currentLocale() {
  try {
    const segment = await rootLocale();
    if (segment) return segment;
  } catch {}
  return (await cookies()).get(LOCALE_COOKIE)?.value;
}

// Wired in next.config.ts.
export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await currentLocale());
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
