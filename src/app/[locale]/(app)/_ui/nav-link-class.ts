import { cn } from "cn";

/** Shared by NavLink and its placeholder so both take exactly the same space. */
export function navLinkClassName(active: boolean, className?: string) {
  return cn(
    "flex h-10 shrink-0 items-center gap-3 rounded-full px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted-strong hover:text-foreground md:h-11 md:px-4 md:text-sm [&_svg]:size-4.5 [&_svg]:shrink-0 max-md:[&_svg]:hidden",
    active &&
      "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
    className,
  );
}
