import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DEFAULT_LOCALE } from "@/shared/i18n";
import { HtmlLang } from "./_ui/html-lang";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("appTitle"), description: t("appDescription") };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* The language comes from a cookie, so every screen renders at request time. */}
        <Suspense>
          <NextIntlClientProvider>
            <HtmlLang />
            {children}
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
