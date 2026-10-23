"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Keeps <html lang> in step with the chosen language; the root layout can't read the cookie. */
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
