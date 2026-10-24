import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { SectionTabs } from "@/shared/ui/section-tabs";
import { SETTINGS_PAGES } from "../_ui/settings-pages";
import { SettingsTabs } from "../_ui/settings-tabs";

/**
 * Admin setup that people visit now and then: who's on the team, how ideas get made,
 * and agent keys. One nav item for all three keeps the phone tab bar to four.
 */
export default function SettingsLayout({
  children,
}: LayoutProps<"/[locale]/settings">) {
  const t = useTranslations();
  const labels = {
    members: t("admin.title"),
    workflow: t("workflow.title"),
    agents: t("agents.title"),
  };
  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-8 md:pr-8 md:pl-2">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("settings.title")}
        </h1>
        {/* The tabs read the URL, so a plain row of the same size holds their place. */}
        <Suspense
          fallback={
            <SectionTabs
              label={t("settings.sections")}
              tabs={SETTINGS_PAGES.map((page) => ({
                href: page.href,
                label: labels[page.key],
                current: false,
              }))}
            />
          }
        >
          <SettingsTabs label={t("settings.sections")} labels={labels} />
        </Suspense>
      </div>
      {children}
    </main>
  );
}
