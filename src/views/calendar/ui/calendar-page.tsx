import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { listCalendarItems } from "../api/list-calendar";
import type { CalendarItem } from "../model/calendar-item";
import { ContentCalendar } from "./content-calendar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar");
  return { title: t("metaTitle") };
}

export function CalendarPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("calendar.title")}
        </h1>
        <p className="text-muted-foreground">{t("calendar.intro")}</p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t("common.loading")}</p>
        }
      >
        <Calendar />
      </Suspense>
    </main>
  );
}

async function Calendar() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const rows = await listCalendarItems({ withProposed: isAdmin });
  const items: CalendarItem[] = rows.flatMap(({ publishDate, ...row }) =>
    publishDate ? [{ ...row, publishDate }] : [],
  );
  return <ContentCalendar items={items} meId={me.id} isAdmin={isAdmin} />;
}
