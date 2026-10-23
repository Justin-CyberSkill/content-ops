// From FullCalendar's shadcn registry (monarch-event-calendar, MIT), imports pointed at shared/ui.
import type { CalendarController } from "@fullcalendar/react";
import { cn } from "cn";
import { Button } from "./button";
import {
  EventCalendarNextIcon,
  EventCalendarPrevIcon,
} from "./event-calendar-icons";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export interface EventCalendarToolbarProps {
  className?: string;
  controller: CalendarController;
  availableViews: string[];
  addButton?: {
    isPrimary?: boolean;
    text?: string;
    hint?: string;
    click?: (ev: MouseEvent) => void;
  };
}

export function EventCalendarToolbar({
  className,
  controller,
  availableViews,
  addButton,
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState();

  return (
    <div
      className={cn(
        "flex items-center justify-between flex-wrap gap-3",
        className,
      )}
    >
      {/* Wraps on phones instead of overflowing (changed from the registry). */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {addButton && (
          <Button
            onClick={(event) => addButton.click?.(event.nativeEvent)}
            aria-label={addButton.hint}
          >
            {addButton.text}
          </Button>
        )}
        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant="outline"
        >
          {buttons.today.text}
        </Button>
        <div className="flex items-center">
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant="ghost"
            size="icon"
          >
            <EventCalendarPrevIcon />
          </Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant="ghost"
            size="icon"
          >
            <EventCalendarNextIcon />
          </Button>
        </div>
        <div className="font-heading text-lg font-semibold md:text-xl">
          {controller.view?.title}
        </div>
      </div>
      <Tabs value={controller.view?.type ?? availableViews[0]}>
        <TabsList>
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              onClick={() => controller.changeView(availableView)}
              aria-label={buttons[availableView]?.hint}
            >
              {buttons[availableView]?.text}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
