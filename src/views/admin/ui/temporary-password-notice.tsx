import { KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function TemporaryPasswordNotice({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const t = useTranslations("admin");
  return (
    <div
      role="status"
      className="flex w-full flex-col gap-2 rounded-xl bg-warning-soft p-4 text-left text-[13px]"
    >
      <p className="flex items-start gap-2 font-semibold">
        <KeyRoundIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-warning"
        />
        <span>
          {t.rich("temporaryPasswordFor", {
            email: () => <span className="break-all">{email}</span>,
          })}
        </span>
      </p>
      <code className="self-start rounded-full bg-card px-4 py-2 font-mono text-sm break-all select-all">
        {password}
      </code>
      <p className="text-muted-foreground">{t("temporaryPasswordHint")}</p>
    </div>
  );
}
