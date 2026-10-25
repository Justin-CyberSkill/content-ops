import {
  InboxIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  SquareCheckBigIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getSession } from "@/shared/auth/index.server";
import { Link } from "@/shared/i18n";
import { signOut } from "@/views/account";
import { countMyTodo } from "@/views/my-tasks/index.server";
import { countPendingProposals } from "@/views/review/index.server";
import { AccountMenu } from "./account-menu";
import { NavLink } from "./nav-link";
import { navLinkClassName } from "./nav-link-class";

export function AppSidebar() {
  const t = useTranslations("nav");
  return (
    <aside className="p-4 pb-0 md:sticky md:top-0 md:h-dvh md:w-68 md:shrink-0 md:pb-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl bg-sidebar p-3 text-sidebar-foreground shadow-card md:h-full md:flex-col md:flex-nowrap md:items-stretch md:gap-6 md:px-3.5 md:py-5">
        <Link
          href="/content"
          className="flex items-center gap-2.5 rounded-full px-1.5 font-heading text-lg font-semibold"
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
          // Daily work first; Settings, visited now and then, sits apart at the bottom.
          className="fixed inset-x-0 bottom-0 z-30 flex h-(--bottom-nav) gap-1 border-t border-border bg-sidebar/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:static md:z-auto md:h-auto md:flex-1 md:flex-col md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
        >
          <SidebarLink href="/content">
            <LayoutDashboardIcon aria-hidden="true" />
            {/* A shorter word in the phone tab bar, so the label stays on one line. */}
            <span className="md:hidden">{t("contentPlanShort")}</span>
            <span className="hidden md:inline">{t("contentPlan")}</span>
          </SidebarLink>
          <Suspense
            fallback={
              <Link href="/my-tasks" className={navLinkClassName(false)}>
                <SquareCheckBigIcon aria-hidden="true" />
                {t("myTasks")}
              </Link>
            }
          >
            <MyTasksLink />
          </Suspense>
          {/* Last in the list, so nothing moves when they show up for admins. */}
          <Suspense>
            <AdminLinks />
          </Suspense>
        </nav>
        {/* One row for you: account, language and sign-out open from it. */}
        <div className="ml-auto flex md:ml-0 md:flex-col md:items-stretch">
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

/** A count on a nav link: the number shows, the label says what it counts. */
function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="absolute top-1 right-[calc(50%-1.5rem)] flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs leading-none font-semibold text-primary-foreground tabular-nums md:static md:ml-auto">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** What's on your To do, so open work stays in view from any page. */
async function MyTasksLink() {
  const session = await getSession();
  const [t, todo] = await Promise.all([
    getTranslations("nav"),
    session ? countMyTodo(session.user.id) : 0,
  ]);
  return (
    <NavLink href="/my-tasks">
      <SquareCheckBigIcon aria-hidden="true" />
      {t("myTasks")}
      {todo ? (
        <CountBadge count={todo} label={t("tasksToDo", { count: todo })} />
      ) : null}
    </NavLink>
  );
}

async function AdminLinks() {
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
          <CountBadge
            count={waiting}
            label={t("reviewWaiting", { count: waiting })}
          />
        ) : null}
      </NavLink>
      <NavLink href="/settings" className="md:mt-auto">
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
  const t = await getTranslations("common.roles");
  return (
    <AccountMenu
      name={name}
      role={t(role === "admin" ? "admin" : "member")}
      signOut={signOut}
    />
  );
}

/** Same box as UserMenu, so the sidebar keeps its size while the session loads. */
function UserMenuPlaceholder() {
  return (
    <span
      aria-hidden="true"
      className="flex min-w-0 items-center gap-2.5 p-1.5 md:pr-3"
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
  );
}
