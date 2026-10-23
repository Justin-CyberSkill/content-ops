import {
  LayoutDashboardIcon,
  LogOutIcon,
  SquareCheckBigIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getSession } from "@/shared/auth/index.server";
import { Link } from "@/shared/i18n";
import { LanguageSwitch } from "@/shared/i18n/language-switch";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { NavLink } from "./nav-link";
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
          className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:flex-col md:overflow-visible"
        >
          <Suspense>
            <NavLink href="/content">
              <LayoutDashboardIcon aria-hidden="true" />
              {t("contentPlan")}
            </NavLink>
            <NavLink href="/my-tasks">
              <SquareCheckBigIcon aria-hidden="true" />
              {t("myTasks")}
            </NavLink>
            <AdminLink />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:mt-auto md:ml-0 md:flex-wrap">
          <LanguageSwitch
            className="md:basis-full"
            buttonClassName="md:flex-1"
          />
          <Suspense>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}

async function AdminLink() {
  const session = await getSession();
  if (session?.user.role !== "admin") return null;
  const t = await getTranslations("nav");
  return (
    <NavLink href="/admin">
      <UsersIcon aria-hidden="true" />
      {t("members")}
    </NavLink>
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
