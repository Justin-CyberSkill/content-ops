import { cn } from "cn";

/**
 * Shared by NavLink and its placeholder so both take exactly the same space.
 * Phones get a bottom tab bar (icon over label); from md it is the sidebar's pill list.
 */
export function navLinkClassName(active: boolean, className?: string) {
  return cn(
    "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center text-2xs font-medium text-muted-foreground transition-colors hover:bg-muted-strong hover:text-foreground md:h-11 md:min-h-0 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-full md:px-4 md:py-0 md:text-left md:text-sm [&_svg]:size-5 [&_svg]:shrink-0 md:[&_svg]:size-4.5",
    active &&
      "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
    className,
  );
}
