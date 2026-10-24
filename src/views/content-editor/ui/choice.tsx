import { cn } from "@/shared/lib";

/** A whole-row button: what happens, and a line on what it means. */
export function Choice({
  icon: Icon,
  title,
  hint,
  primary,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
        primary
          ? "bg-primary text-primary-foreground hover:brightness-110"
          : "bg-muted hover:bg-muted-strong",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          primary ? "bg-primary-foreground/15" : "bg-card",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span
          className={cn(
            "text-[13px]",
            primary ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}
