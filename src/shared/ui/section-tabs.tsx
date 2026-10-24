import { cn } from "cn";
import { Link } from "@/shared/i18n";

/**
 * Tabs between the pages of one section, such as Team and Workflow under Members.
 * The page says which tab it is, so nothing waits on reading the URL.
 */
export function SectionTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { href: string; label: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex w-fit max-w-full gap-0.5 rounded-full bg-muted-strong p-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "flex h-9 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                tab.current &&
                  "bg-card font-semibold text-foreground shadow-card",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
