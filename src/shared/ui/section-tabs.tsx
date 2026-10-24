import { cn } from "cn";
import { Link } from "@/shared/i18n";

/**
 * Tabs between the pages of one section, such as the tabs of Settings. The caller says
 * which tab is open. On a narrow screen the row scrolls sideways rather than wrapping.
 */
export function SectionTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { href: string; label: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="max-w-full overflow-x-auto">
      <ul className="flex w-fit gap-0.5 rounded-full bg-muted-strong p-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "flex h-9 items-center rounded-full px-3 text-sm whitespace-nowrap sm:px-4 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
