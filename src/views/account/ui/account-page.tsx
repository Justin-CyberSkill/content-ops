import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { ChangePasswordForm } from "./change-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("metaTitle") };
}

export function AccountPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full max-w-275 flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {t("account.title")}
      </h1>
      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label={t("account.profile")}
          className="flex min-w-0 flex-[1_1_18rem] flex-col items-start gap-4 rounded-2xl bg-card p-7 shadow-card"
        >
          <Suspense
            fallback={
              <p className="text-muted-foreground">{t("common.loading")}</p>
            }
          >
            <Profile />
          </Suspense>
        </section>
        <section
          aria-labelledby="password-heading"
          className="flex min-w-0 flex-[2_1_24rem] flex-col gap-5 rounded-2xl bg-card p-7 shadow-card"
        >
          <div className="flex flex-col gap-1">
            <h2 id="password-heading" className="text-lg font-semibold">
              {t("account.changePassword")}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {t("account.changePasswordHint")}
            </p>
          </div>
          <ChangePasswordForm />
        </section>
      </div>
    </main>
  );
}

async function Profile() {
  const user = await requireUser();
  const t = await getTranslations("common.roles");
  return (
    <>
      <Avatar name={user.name} size="xl" />
      <div className="flex min-w-0 max-w-full flex-col gap-1">
        <h2 className="text-2xl font-semibold">{user.name}</h2>
        <p className="truncate text-muted-foreground">{user.email}</p>
      </div>
      <Badge
        variant={user.role === "admin" ? "default" : "secondary"}
        className="pl-2.5"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        {t(user.role === "admin" ? "admin" : "member")}
      </Badge>
    </>
  );
}
