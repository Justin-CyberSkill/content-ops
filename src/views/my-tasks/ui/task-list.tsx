import {
  CheckIcon,
  ClockIcon,
  LinkIcon,
  MessageSquareWarningIcon,
  SquareCheckBigIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { contentHref, formatSchedule } from "@/entities/content";
import { DueDay, TaskStatusBadge } from "@/entities/task";
import { TaskStatusSelect } from "@/features/task-progress";
import { DATE_LOCALES, Link, type Locale } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { buttonVariants } from "@/shared/ui/button";
import { MarkdownPreview } from "@/shared/ui/markdown";
import type { MyTask } from "../api/list-my-tasks";
import { groupTasks } from "../model/task-groups";
import { StatusSelect } from "./status-select";

/**
 * What to work on first: your open tasks, soonest due first. Then tasks that come to
 * you once someone else finishes, which you can't start yet, and what you finished lately.
 */
export function TaskList({ tasks, today }: { tasks: MyTask[]; today: string }) {
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

  const groups = groupTasks(tasks);
  return (
    <div className="flex flex-col gap-8">
      <TaskGroup
        title={t("myTasks.upNext")}
        tasks={groups.todo}
        today={today}
        empty={t("myTasks.upNextEmpty")}
      />
      {groups.waiting.length ? (
        <TaskGroup
          title={t("myTasks.waiting")}
          hint={t("myTasks.waitingHint")}
          tasks={groups.waiting}
          today={today}
        />
      ) : null}
      {groups.done.length ? (
        <TaskGroup
          title={t("myTasks.done")}
          hint={t("myTasks.doneHint")}
          tasks={groups.done}
          today={today}
        />
      ) : null}
    </div>
  );
}

function TaskGroup({
  title,
  hint,
  tasks,
  today,
  empty,
}: {
  title: string;
  hint?: string;
  tasks: MyTask[];
  today: string;
  empty?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          {title}
          <span className="font-sans text-[13px] font-normal text-muted-foreground tabular-nums">
            {tasks.length}
          </span>
        </h2>
        {hint ? (
          <p className="text-[13px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {!tasks.length && empty ? (
        <p className="px-1 text-muted-foreground">{empty}</p>
      ) : null}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(24rem,100%),1fr))] gap-5">
        {tasks.map((row) => (
          <TaskCard key={row.key} row={row} today={today} />
        ))}
      </ul>
    </section>
  );
}

function TaskCard({ row, today }: { row: MyTask; today: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { task, item } = row;
  const publishing = task?.kind === "publish";
  const reviewOpen =
    task?.kind === "review" &&
    (task.status === "todo" || task.status === "in_progress");
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card">
      {task ? (
        // The task is what you're here for; the item it belongs to follows.
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
          <span className="font-semibold">{task.name}</span>
          <DueDay
            dueDate={task.dueDate}
            today={today}
            done={task.status === "done"}
            className="text-muted-foreground"
          />
        </p>
      ) : null}
      {task?.changesRequested ? (
        <div className="-mt-1 flex gap-2.5 rounded-xl bg-status-in-review-bg px-3.5 py-3 text-sm">
          <MessageSquareWarningIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-status-in-review"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-semibold text-status-in-review">
              {task.changesRequested.by
                ? t("myTasks.changesRequestedBy", {
                    name: task.changesRequested.by,
                  })
                : t("myTasks.changesRequested")}
            </span>
            <p className="line-clamp-3 break-words">
              <MarkdownPreview>{task.changesRequested.note}</MarkdownPreview>
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex items-start gap-3.5">
        <DateTile
          publishDate={item.publishDate}
          locale={locale}
          noDate={t("common.noDate")}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={contentHref(item.id, "tasks")}
            className="text-base font-semibold break-words hover:underline"
          >
            {item.idea}
          </Link>
          <p className="line-clamp-2 text-[13px] break-words text-muted-foreground">
            <MarkdownPreview>{item.goal}</MarkdownPreview>
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5 text-xs font-medium">
        <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-3 tabular-nums">
          <ClockIcon aria-hidden="true" className="size-3.5" />
          {formatSchedule(item.publishDate, item.goldenTime, locale) ??
            t("common.noDate")}
        </li>
        <li className="inline-flex h-7 items-center rounded-full bg-muted px-3">
          {t(`content.type.${item.type}`)}
        </li>
        {item.platforms.map((p) => {
          // Publishing ticks off each platform as its live link goes in.
          const live = publishing && task?.live.includes(p);
          return (
            <li
              key={p}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-3",
                live
                  ? "bg-status-published-bg text-status-published"
                  : "bg-muted",
              )}
            >
              {live ? (
                <CheckIcon
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={3}
                />
              ) : null}
              {t(`content.platform.${p}`)}
              {live ? (
                <span className="sr-only">
                  {` (${t("contentEditor.publish.live")})`}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[13px]">
          {publishing && task.status !== "waiting" ? (
            <span className="text-muted-foreground tabular-nums">
              {t("myTasks.liveCount", {
                live: task.live.length,
                total: item.platforms.length,
              })}
            </span>
          ) : task?.waitingFor ? (
            <span className="text-muted-foreground">
              {task.waitingFor.assigneeName
                ? t("myTasks.waitingFor", {
                    task: task.waitingFor.name,
                    name: task.waitingFor.assigneeName,
                  })
                : t("myTasks.waitingForUnassigned", {
                    task: task.waitingFor.name,
                  })}
            </span>
          ) : (
            item.assetLinks.map((link) => (
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
            ))
          )}
        </div>
        {!task ? (
          <StatusSelect
            id={item.id}
            status={item.status}
            label={t("myTasks.statusOf", { idea: item.idea })}
          />
        ) : task.status === "waiting" ? (
          <TaskStatusBadge status="waiting" />
        ) : reviewOpen ? (
          // A review is decided on the item's page, beside the work.
          <Link
            href={contentHref(item.id, "tasks")}
            className={buttonVariants({
              size: "sm",
              className: "relative z-10",
            })}
          >
            {t("myTasks.openToReview")}
          </Link>
        ) : (
          <TaskStatusSelect
            key={task.status}
            taskId={task.id}
            status={task.status}
            label={t("myTasks.taskStatusOf", {
              task: task.name,
              idea: item.idea,
            })}
          />
        )}
      </div>
    </li>
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
