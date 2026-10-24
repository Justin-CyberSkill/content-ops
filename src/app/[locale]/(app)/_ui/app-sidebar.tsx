import {
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  SquareCheckBigIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getSession } from "@/shared/auth/index.server";
import { Link } from "@/shared/i18n";
import { LanguageSwitch } from "@/shared/i18n/language-switch";
import { Avatar } from "@/shared/ui/avatar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { countPendingProposals } from "@/views/review/index.server";
import { NavLink } from "./nav-link";
import { navLinkClassName } from "./nav-link-class";
import { signOut } from "./sign-out";

export function AppSidebar() {
  const t = useTranslations("nav");
  return (
    <aside className="p-4 pb-0 md:sticky md:top-0 md:h-dvh md:w-68 md:shrink-0 md:pb-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl bg-sidebar p-3 text-sidebar-foreground shadow-card md:h-full md:flex-col md:flex-nowrap md:items-stretch md:gap-6 md:px-3.5 md:py-5">
        <Link
          href="/content"
          className="flex items-center gap-2.5 rounded-full px-1.5 font-heading text-[17px] font-semibold"
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            CS
          </span>
          Content Ops
        </Link>
        <nav
          aria-label={t("label")}
          // A bottom tab bar on phones, so every section stays in reach; the sidebar list from md.
          className="fixed inset-x-0 bottom-0 z-30 flex h-(--bottom-nav) gap-1 border-t border-border bg-sidebar/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:static md:z-auto md:h-auto md:flex-col md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
        >
          <SidebarLink href="/content">
            <LayoutDashboardIcon aria-hidden="true" />
            {t("contentPlan")}
          </SidebarLink>
          <SidebarLink href="/my-tasks">
            <SquareCheckBigIcon aria-hidden="true" />
            {t("myTasks")}
          </SidebarLink>
          {/* Last in the list, so nothing moves when it shows up for admins. */}
          <Suspense>
            <AdminLink />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:mt-auto md:ml-0 md:flex-wrap">
          <LanguageSwitch
            className="md:basis-full"
            buttonClassName="md:flex-1"
          />
          <Suspense fallback={<UserMenuPlaceholder />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}

/**
 * NavLink reads the URL, so it waits for the request. Until then a plain link of the
 * same size holds its place; only the highlight arrives later.
 */
function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={navLinkClassName(false)}>
          {children}
        </Link>
      }
    >
      <NavLink href={href}>{children}</NavLink>
    </Suspense>
  );
}

async function AdminLink() {
  const session = await getSession();
  if (session?.user.role !== "admin") return null;
  const [t, waiting] = await Promise.all([
    getTranslations("nav"),
    countPendingProposals(),
  ]);
  return (
    <>
      <NavLink href="/review">
        <InboxIcon aria-hidden="true" />
        {t("review")}
        {waiting ? (
          <span className="absolute top-1 right-[calc(50%-1.5rem)] flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums md:static md:ml-auto">
            <span aria-hidden="true">{waiting}</span>
            <span className="sr-only">
              {t("reviewWaiting", { count: waiting })}
            </span>
          </span>
        ) : null}
      </NavLink>
      {/* Members, workflow and agent keys: set up now and then, so one item, last. */}
      <NavLink href="/settings">
        <SettingsIcon aria-hidden="true" />
        {t("settings")}
      </NavLink>
    </>
  );
}

async function UserMenu() {
  const session = await getSession();
  if (!session) return null;
  const { name, role } = session.user;
  const t = await getTranslations();
  return (
    <>
      <Link
        href="/account"
        aria-label={t("nav.account", { name })}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full p-1.5 transition-colors hover:bg-muted-strong md:pr-3"
      >
        <Avatar name={name} />
        <span className="hidden min-w-0 flex-col md:flex">
          <span className="truncate font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">
            {t(role === "admin" ? "common.roles.admin" : "common.roles.member")}
          </span>
        </span>
      </Link>
      <form action={signOut}>
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          aria-label={t("nav.signOut")}
        >
          <LogOutIcon aria-hidden="true" />
        </Button>
      </form>
    </>
  );
}

/** Same boxes as UserMenu, so the sidebar keeps its size while the session loads. */
function UserMenuPlaceholder() {
  return (
    <>
      <span
        aria-hidden="true"
        className="flex min-w-0 flex-1 items-center gap-2.5 p-1.5 md:pr-3"
      >
        <span className="size-9 shrink-0 rounded-full bg-muted-strong" />
        <span className="hidden flex-col items-start text-transparent md:flex">
          <span className="w-28 rounded-full bg-muted-strong font-semibold">
            &nbsp;
          </span>
          <span className="w-14 rounded-full bg-muted-strong text-xs">
            &nbsp;
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className={buttonVariants({ variant: "secondary", size: "icon" })}
      />
    </>
  );
}
