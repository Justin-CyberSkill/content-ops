import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { todayIn } from "@/entities/task";
import { requireUser } from "@/shared/auth/index.server";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { listMyTasks } from "../api/list-my-tasks";
import { TaskList } from "./task-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myTasks");
  return { title: t("metaTitle") };
}

export function MyTasksPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("myTasks.title")}
        </h1>
        <p className="text-muted-foreground">{t("myTasks.intro")}</p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t("common.loading")}</p>
        }
      >
        <MyTasks />
      </Suspense>
    </main>
  );
}

async function MyTasks() {
  const me = await requireUser();
  return (
    <TaskList
      tasks={await listMyTasks(me.id)}
      today={todayIn(TEAM_TIME_ZONE)}
    />
  );
}
