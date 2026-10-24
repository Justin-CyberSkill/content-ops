"use client";

import { cn } from "cn";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALE_NAMES, LOCALES, type Locale } from "./config";
import { useRouter } from "./navigation";

/** Opens the same page under another language's URL, keeping the query. */
export function useSwitchLocale() {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const switchTo = (locale: Locale) => {
    // Read the URL on click: usePathname would make every page wait for it before rendering.
    const { pathname, search } = window.location;
    const path = pathname.replace(`/${current}`, "") || "/";
    // Keep the query too, such as ?next= on the sign-in page.
    startTransition(() => router.replace(path + search, { locale }));
  };
  return { current, pending, switchTo };
}

/** VI | EN pill. Opens the same page under the other language's URL. */
export function LanguageSwitch({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  const t = useTranslations("nav");
  const { current, pending, switchTo } = useSwitchLocale();
  return (
    <fieldset
      aria-label={t("language")}
      disabled={pending}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-1",
        className,
      )}
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-label={LOCALE_NAMES[locale]}
          aria-pressed={locale === current}
          onClick={() => switchTo(locale)}
          className={cn(
            "h-8 rounded-full px-3 text-xs font-semibold text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            locale === current && "bg-card text-foreground shadow-card",
            buttonClassName,
          )}
        >
          {locale}
        </button>
      ))}
    </fieldset>
  );
}
