"use client";

import { Link, usePathname } from "@/shared/i18n";
import { navLinkClassName } from "./nav-link-class";

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
  // Items open under their list (/my-tasks/[id]), so the list stays lit.
  const current = usePathname();
  const pathname = current === "/" ? "/content" : current;
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={navLinkClassName(active, className)}
    >
      {children}
    </Link>
  );
}
