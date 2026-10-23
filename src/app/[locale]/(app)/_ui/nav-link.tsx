"use client";

import { cn } from "cn";
import { Link, usePathname } from "@/shared/i18n";

/** Sidebar link, a charcoal pill when its section is open. */
export function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Without the language prefix. After sign-in it can be "/" while next.config redirects to /content.
  const current = usePathname();
  const pathname = current === "/" ? "/content" : current;
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 shrink-0 items-center gap-3 rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted-strong hover:text-foreground md:h-11 md:px-4 md:text-sm [&_svg]:size-4.5 [&_svg]:shrink-0 max-md:[&_svg]:hidden",
        active &&
          "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
