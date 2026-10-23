"use client";

import viLocale from "@fullcalendar/react/locales/vi";
import { UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { StatusBadge } from "@/entities/content";
import { CONTENT_STATUSES, type ContentStatus } from "@/shared/db/schema";
import { useRouter } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { EventCalendar } from "@/shared/ui/event-calendar";
import { rescheduleContent } from "../api/reschedule";
import {
  CALENDAR_TIME_ZONE,
  type CalendarItem,
  eventStart,
  scheduleFromDrop,
  visibleItems,
} from "../model/calendar-item";

// 24-hour, like golden times everywhere else.
const TIME_FORMAT = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

// Status text colours fill the event; the card colour reads on them in light and dark.
const statusColor: Record<ContentStatus, string> = {
  proposed: "var(--status-proposed)",
  planned: "var(--status-planned)",
  in_progress: "var(--status-in-progress)",
  in_review: "var(--status-in-review)",
  scheduled: "var(--status-scheduled)",
  published: "var(--status-published)",
};

export function ContentCalendar({
  items,
  meId,
  isAdmin,
}: {
  items: CalendarItem[];
  meId: string;
  isAdmin: boolean;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const router = useRouter();
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  const shown = visibleItems(items, { mineOnly, meId });
  const statuses = CONTENT_STATUSES.filter(
    (status) => status !== "proposed" || isAdmin,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Button
          variant={mineOnly ? "default" : "outline"}
          size="sm"
          aria-pressed={mineOnly}
          onClick={() => setMineOnly((value) => !value)}
        >
          <UserIcon aria-hidden="true" />
          {t("mineOnly")}
        </Button>
        <ul aria-label={t("legend")} className="flex flex-wrap gap-1.5">
          {statuses.map((status) => (
            <li
              key={status}
              className={cn(status === "proposed" && "opacity-60")}
            >
              <StatusBadge status={status} />
            </li>
          ))}
        </ul>
      </div>
      {isAdmin ? (
        <p className="text-[13px] text-muted-foreground">
          {t("dragHint")} {t("proposedHint")}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive-soft px-5 py-3.5 text-foreground"
        >
          {error}
        </p>
      ) : null}

      <div className="min-w-0 rounded-2xl bg-card p-2 shadow-card md:p-4">
        <EventCalendar
          availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
          className="bg-card"
          borderless
          height="auto"
          eventTimeFormat={TIME_FORMAT}
          slotHeaderFormat={TIME_FORMAT}
          tableHeaderClass="bg-card"
          timeZone={CALENDAR_TIME_ZONE}
          locale={locale === "vi" ? viLocale : undefined}
          firstDay={1}
          allDayText={t("noTime")}
          editable={isAdmin}
          eventDurationEditable={false}
          events={shown.map((item) => ({
            id: item.id,
            title: item.idea,
            start: eventStart(item),
            allDay: item.goldenTime === null,
            url: `/${locale}/content/${item.id}`,
            color: statusColor[item.status],
            contrastColor: "var(--card)",
            // Proposals are for admins only, and faded until someone approves them.
            className: item.status === "proposed" ? "opacity-55" : undefined,
          }))}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            router.push(`/content/${info.event.id}`);
          }}
          eventDrop={(info) => {
            const { start, allDay, id } = info.event;
            if (!start) return info.revert();
            const next = scheduleFromDrop(start, allDay);
            setError(undefined);
            startTransition(async () => {
              const result = await rescheduleContent(
                id,
                next.publishDate,
                next.goldenTime,
              ).catch(() => ({ error: t("errors.failed") }));
              if (result.error) {
                info.revert();
                setError(result.error);
              }
            });
          }}
        />
      </div>
    </div>
  );
}
