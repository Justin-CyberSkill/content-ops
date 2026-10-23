"use client";

import { cn } from "cn";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALE_NAMES, LOCALES } from "@/shared/i18n";
import { setLocale } from "./set-locale";

/** VI | EN pill. Saves the choice in a cookie; the server re-renders in that language. */
export function LanguageSwitch() {
  const t = useTranslations("nav");
  const current = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <fieldset
      aria-label={t("language")}
      disabled={pending}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-1 md:basis-full"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-label={LOCALE_NAMES[locale]}
          aria-pressed={locale === current}
          onClick={() => startTransition(() => setLocale(locale))}
          className={cn(
            "h-8 rounded-full px-3 text-xs md:flex-1 font-semibold text-muted-foreground uppercase transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            locale === current && "bg-card text-foreground shadow-card",
          )}
        >
          {locale}
        </button>
      ))}
    </fieldset>
  );
}
