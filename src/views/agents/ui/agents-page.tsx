import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { requireAdmin } from "@/shared/auth/index.server";
import { env, TEAM_TIME_ZONE } from "@/shared/config";
import { DATE_LOCALES, DEFAULT_LOCALE, isLocale } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { listAgentKeys } from "../api/keys";
import { CopyCommand } from "./copy-command";
import { CreateKeyForm } from "./create-key-form";
import { KeyActions } from "./key-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agents");
  return { title: t("metaTitle") };
}

export function AgentsPage() {
  const t = useTranslations();
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("agents.title")}
        </h1>
        <p className="text-muted-foreground">{t("agents.intro")}</p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <section
          aria-labelledby="keys-heading"
          className="flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-6 shadow-card md:p-7"
        >
          <h2 id="keys-heading" className="text-lg font-semibold">
            {t("agents.keysTitle")}
          </h2>
          <CreateKeyForm />
          <Suspense
            fallback={
              <p className="text-muted-foreground">{t("common.loading")}</p>
            }
          >
            <KeyList />
          </Suspense>
        </section>
        <ConnectCard />
      </div>
    </main>
  );
}

async function KeyList() {
  await requireAdmin();
  const [keys, t, current] = await Promise.all([
    listAgentKeys(),
    getTranslations("agents"),
    getLocale(),
  ]);
  if (!keys.length) {
    return <p className="text-[13px] text-muted-foreground">{t("empty")}</p>;
  }
  const locale = isLocale(current) ? current : DEFAULT_LOCALE;
  const format = (at: Date) =>
    new Intl.DateTimeFormat(DATE_LOCALES[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: TEAM_TIME_ZONE,
    }).format(at);

  return (
    <ul className="flex flex-col divide-y divide-border">
      {keys.map((key) => {
        const name = key.name ?? t("unnamed");
        return (
          <li
            key={key.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold break-words">{name}</span>
                <Badge variant={key.enabled ? "default" : "secondary"}>
                  {key.enabled ? t("active") : t("disabled")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                <code className="font-mono">{key.start}…</code>
                {" · "}
                {t("createdBy", {
                  name: key.createdBy ?? t("removedMember"),
                  when: format(key.createdAt),
                })}
                {" · "}
                {key.lastRequest
                  ? t("lastUsed", { when: format(key.lastRequest) })
                  : t("neverUsed")}
              </p>
            </div>
            <KeyActions id={key.id} name={name} enabled={key.enabled ?? true} />
          </li>
        );
      })}
    </ul>
  );
}

function ConnectCard() {
  const t = useTranslations("agents.connect");
  const command = `claude mcp add --transport http content-ops ${new URL("/api/mcp", env.BETTER_AUTH_URL)} --header "x-api-key: csops_…"`;
  return (
    <section
      aria-labelledby="connect-heading"
      className="flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-6 shadow-card"
    >
      <h2 id="connect-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>
      <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
        <li>{t("step1")}</li>
        <li className="min-w-0">
          {t("step2")}
          <CopyCommand command={command} />
        </li>
        <li>{t("step3")}</li>
      </ol>
      <p className="text-[13px] text-muted-foreground">{t("limits")}</p>
    </section>
  );
}
