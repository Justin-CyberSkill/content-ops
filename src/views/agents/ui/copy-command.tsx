"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/shared/ui/button";

/** A command to paste into a terminal, wrapped so all of it shows, with a button that copies it. */
export function CopyCommand({ command }: { command: string }) {
  const t = useTranslations("agents");
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex flex-col items-start gap-2">
      <pre className="w-full rounded-lg bg-muted px-3 py-2 font-mono text-xs break-words whitespace-pre-wrap">
        {command}
      </pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(command);
          setCopied(true);
        }}
      >
        {copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}
