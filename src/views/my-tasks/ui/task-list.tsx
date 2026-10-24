import { ClockIcon, LinkIcon, SquareCheckBigIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { contentHref, formatSchedule } from "@/entities/content";
import { DATE_LOCALES, Link, type Locale } from "@/shared/i18n";
import { buttonVariants } from "@/shared/ui/button";
import type { Task } from "../api/list-my-tasks";
import { StatusSelect } from "./status-select";

/**
 * What to work on first: open tasks by publish day, then what's already published,
 * so finished work doesn't crowd the list.
 */
export function TaskList({ tasks }: { tasks: Task[] }) {
  const t = useTranslations();
  if (!tasks.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center shadow-card">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <SquareCheckBigIcon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-semibold">
            {t("myTasks.emptyTitle")}
          </p>
          <p className="max-w-sm text-muted-foreground">
            {t("myTasks.emptyBody")}
          </p>
        </div>
        <Link
          href="/content"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("myTasks.openPlan")}
        </Link>
      </div>
    );

  const open = tasks.filter((task) => task.status !== "published");
  const done = tasks.filter((task) => task.status === "published");
  return (
    <div className="flex flex-col gap-8">
      <TaskGroup
        title={t("myTasks.upNext")}
        count={open.length}
        tasks={open}
        empty={t("myTasks.upNextEmpty")}
      />
      {done.length ? (
        <TaskGroup
          title={t("myTasks.published")}
          count={done.length}
          tasks={done}
        />
      ) : null}
    </div>
  );
}

function TaskGroup({
  title,
  count,
  tasks,
  empty,
}: {
  title: string;
  count: number;
  tasks: Task[];
  empty?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 px-1 text-lg font-semibold">
        {title}
        <span className="font-sans text-[13px] font-normal text-muted-foreground tabular-nums">
          {count}
        </span>
      </h2>
      {!tasks.length && empty ? (
        <p className="px-1 text-muted-foreground">{empty}</p>
      ) : null}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(24rem,100%),1fr))] gap-5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card"
          >
            <div className="flex items-start gap-3.5">
              <DateTile
                publishDate={task.publishDate}
                locale={locale}
                noDate={t("common.noDate")}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={contentHref(task.id, "tasks")}
                  className="text-base font-semibold hover:underline"
                >
                  {task.idea}
                </Link>
                <p className="text-[13px] text-muted-foreground">{task.goal}</p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-1.5 text-xs font-medium">
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-3 tabular-nums">
                <ClockIcon aria-hidden="true" className="size-3.5" />
                {formatSchedule(task.publishDate, task.goldenTime, locale) ??
                  t("common.noDate")}
              </li>
              <li className="inline-flex h-7 items-center rounded-full bg-muted px-3">
                {t(`content.type.${task.type}`)}
              </li>
              {task.platforms.map((p) => (
                <li
                  key={p}
                  className="inline-flex h-7 items-center rounded-full bg-muted px-3"
                >
                  {t(`content.platform.${p}`)}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                {task.assetLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent-foreground underline-offset-4 hover:underline"
                  >
                    <LinkIcon aria-hidden="true" className="size-3.5" />
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
              <StatusSelect
                id={task.id}
                status={task.status}
                label={t("myTasks.statusOf", { idea: task.idea })}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Weekday over day of month, like a desk calendar. The full date is in the meta row. */
function DateTile({
  publishDate,
  locale,
  noDate,
}: {
  publishDate: string | null;
  locale: Locale;
  noDate: string;
}) {
  const date = publishDate ? new Date(`${publishDate}T00:00:00Z`) : null;
  const weekday = new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    weekday: "short",
    timeZone: "UTC",
  });
  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-15 shrink-0 flex-col items-center justify-center rounded-xl bg-muted tabular-nums"
    >
      {date ? (
        <>
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {weekday.format(date)}
          </span>
          <span className="font-heading text-2xl leading-7 font-semibold">
            {date.getUTCDate()}
          </span>
        </>
      ) : (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {noDate}
        </span>
      )}
    </div>
  );
}
