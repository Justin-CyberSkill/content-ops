import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return { title: t("metaTitle") };
}

type SearchParams = Promise<{ next?: string | string[] }>;

export function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const t = useTranslations("signIn");
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6 font-heading text-[17px] font-semibold md:px-8">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          CS
        </span>
        Content Ops
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-240 flex-wrap gap-6">
          <section
            aria-hidden="true"
            className="relative hidden min-h-130 flex-[1_1_22rem] flex-col justify-between overflow-hidden rounded-4xl bg-brand p-10 text-[#1c1c1f] md:flex"
          >
            <svg
              aria-hidden="true"
              width="360"
              height="360"
              viewBox="0 0 360 360"
              className="absolute -right-24 -bottom-24"
            >
              <circle
                cx="180"
                cy="180"
                r="160"
                fill="none"
                stroke="#fff"
                strokeOpacity=".22"
                strokeWidth="28"
              />
              <circle
                cx="180"
                cy="180"
                r="112"
                fill="none"
                stroke="#fff"
                strokeOpacity=".32"
                strokeWidth="28"
              />
              <circle
                cx="180"
                cy="180"
                r="64"
                fill="none"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="28"
              />
            </svg>
            <span className="self-start rounded-full bg-white/85 px-3.5 py-1.5 text-[13px] font-semibold">
              {t("teamBadge")}
            </span>
            <div className="relative flex max-w-90 flex-col gap-3">
              <p className="font-heading text-4xl leading-11 font-semibold tracking-tight">
                {t("heroTitle")}
              </p>
              <p className="text-[15px]">{t("heroBody")}</p>
            </div>
          </section>
          <section className="flex flex-[1_1_22rem] flex-col justify-center gap-7 rounded-4xl bg-card p-8 shadow-card md:p-10">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl font-semibold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("noAccount")}</p>
            </div>
            <Suspense fallback={<SignInForm />}>
              <SignInFormWithNext searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}

async function SignInFormWithNext({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : undefined} />;
}
