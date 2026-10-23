import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { Link } from "@/shared/i18n";
import { buttonVariants } from "@/shared/ui/button";
import { listContent } from "../api/list-content";
import { TEAM_TIME_ZONE } from "../config/team-time-zone";
import { todayIn } from "../model/content-groups";
import { ContentTable } from "./content-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contentList");
  return { title: t("metaTitle") };
}

export function ContentListPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t("contentList.title")}
          </h1>
          <p className="text-muted-foreground">{t("contentList.intro")}</p>
        </div>
        <Link href="/content/new" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" />
          {t("contentList.newContent")}
        </Link>
      </div>
      <section className="rounded-2xl bg-card p-3 shadow-card md:p-4">
        <Suspense
          fallback={
            <p className="p-4 text-muted-foreground">{t("common.loading")}</p>
          }
        >
          <ContentList />
        </Suspense>
      </section>
    </main>
  );
}

async function ContentList() {
  await requireUser();
  return (
    <ContentTable rows={await listContent()} today={todayIn(TEAM_TIME_ZONE)} />
  );
}
