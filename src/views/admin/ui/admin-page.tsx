import type { Metadata } from "next";
import { headers } from "next/headers";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { auth, requireAdmin } from "@/shared/auth/index.server";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { CreateMemberForm } from "./create-member-form";
import { ResetPasswordButton } from "./reset-password-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("metaTitle") };
}

export function AdminPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground">{t("admin.intro")}</p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t("common.loading")}</p>
        }
      >
        <Members />
      </Suspense>
    </main>
  );
}

async function Members() {
  const me = await requireAdmin();
  const t = await getTranslations();
  const { users } = await auth.api.listUsers({
    query: { limit: 500, sortBy: "createdAt", sortDirection: "asc" },
    headers: await headers(),
  });

  return (
    <>
      <section
        aria-labelledby="add-member-heading"
        className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card md:p-7"
      >
        <h2 id="add-member-heading" className="text-lg font-semibold">
          {t("admin.addMember")}
        </h2>
        <CreateMemberForm />
      </section>
      <section aria-labelledby="team-heading" className="flex flex-col gap-4">
        <h2
          id="team-heading"
          className="flex items-baseline gap-2 px-1 text-xl font-semibold"
        >
          {t("admin.team")}
          <span className="font-sans text-[13px] font-normal text-muted-foreground">
            {t("admin.peopleCount", { count: users.length })}
          </span>
        </h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))] gap-5">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-card"
            >
              <Avatar name={user.name} size="lg" />
              <div className="flex max-w-full min-w-0 flex-col gap-0.5">
                <p className="font-heading text-[17px] font-semibold">
                  {user.name}
                  {user.id === me.id ? (
                    <span className="font-sans text-[13px] font-normal text-muted-foreground">
                      {" "}
                      {t("admin.you")}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="pl-2.5"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-current"
                />
                {t(
                  user.role === "admin"
                    ? "common.roles.admin"
                    : "common.roles.member",
                )}
              </Badge>
              {user.id === me.id ? null : (
                <ResetPasswordButton userId={user.id} email={user.email} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
