/** The Settings tabs in order. Plain data, so the server layout and the client tabs both read it. */
export const SETTINGS_PAGES = [
  { href: "/settings/members", key: "members" },
  { href: "/settings/work-types", key: "workTypes" },
  { href: "/settings/workflow", key: "workflow" },
  { href: "/settings/agents", key: "agents" },
] as const;

export type SettingsPageKey = (typeof SETTINGS_PAGES)[number]["key"];
