"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";

/**
 * Copies `text` for pasting into a platform. Says "Copied" for a moment, and says so
 * to screen readers too, since a button's own text change isn't announced.
 */
export function CopyButton({
  text,
  label,
  children,
}: {
  text: string;
  /** Names what it copies, such as "Copy caption for Facebook". */
  label: string;
  /** The visible text; "Copy" when left out. */
  children?: React.ReactNode;
}) {
  const t = useTranslations("common");
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="xs"
        aria-label={label}
        disabled={!text}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState("copied");
          } catch {
            setState("failed");
          }
        }}
      >
        {state === "copied" ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {state === "copied" ? t("copied") : (children ?? t("copy"))}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? t("copied") : ""}
      </span>
      {state === "failed" ? (
        <span role="alert" className="text-right text-xs text-destructive">
          {t("copyFailed")}
        </span>
      ) : null}
    </span>
  );
}
