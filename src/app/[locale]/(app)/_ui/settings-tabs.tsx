"use client";

import { usePathname } from "@/shared/i18n";
import { SectionTabs } from "@/shared/ui/section-tabs";
import { SETTINGS_PAGES, type SettingsPageKey } from "./settings-pages";

/** The Settings tabs, the open one marked from the URL. */
export function SettingsTabs({
  label,
  labels,
}: {
  label: string;
  labels: Record<SettingsPageKey, string>;
}) {
  const pathname = usePathname();
  return (
    <SectionTabs
      label={label}
      tabs={SETTINGS_PAGES.map((page) => ({
        href: page.href,
        label: labels[page.key],
        current: pathname === page.href,
      }))}
    />
  );
}
