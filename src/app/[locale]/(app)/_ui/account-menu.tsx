"use client";

import { Menu } from "@base-ui/react/menu";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  UserRoundIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Link, LOCALES } from "@/shared/i18n";
import { LOCALE_NAMES } from "@/shared/i18n/config";
import { useSwitchLocale } from "@/shared/i18n/language-switch";
import { Avatar } from "@/shared/ui/avatar";

const itemClass =
  "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm font-medium outline-none data-highlighted:bg-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/**
 * You, in one row: your name and role open a menu with your account, the language
 * and signing out. Rarely used, so they wait behind one click instead of stacking up.
 */
export function AccountMenu({
  name,
  role,
  signOut,
}: {
  name: string;
  role: string;
  /** The sign-out Server Action, passed in so this client file doesn't import the account view. */
  signOut: () => Promise<void>;
}) {
  const t = useTranslations("nav");
  const { current, pending, switchTo } = useSwitchLocale();
  const [signingOut, startSignOut] = useTransition();
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("accountMenu", { name })}
        className="flex min-w-0 items-center gap-2.5 rounded-full p-1.5 text-left transition-colors outline-none hover:bg-muted-strong focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-muted-strong md:pr-3"
      >
        <Avatar name={name} />
        <span className="hidden min-w-0 flex-1 flex-col md:flex">
          <span className="truncate font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
        </span>
        <ChevronsUpDownIcon
          aria-hidden="true"
          className="hidden size-4 shrink-0 text-muted-foreground md:block"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="flex min-w-56 flex-col gap-0.5 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-float outline-none">
            <Menu.LinkItem
              render={<Link href="/account" />}
              className={itemClass}
            >
              <UserRoundIcon aria-hidden="true" />
              {t("accountLink")}
            </Menu.LinkItem>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.RadioGroup
              value={current}
              onValueChange={(locale) => switchTo(locale)}
              disabled={pending}
            >
              <Menu.GroupLabel className="px-3 pt-1 pb-0.5 text-xs text-muted-foreground">
                {t("language")}
              </Menu.GroupLabel>
              {LOCALES.map((locale) => (
                <Menu.RadioItem
                  key={locale}
                  value={locale}
                  lang={locale}
                  closeOnClick
                  className={itemClass}
                >
                  <span className="flex size-4 items-center justify-center">
                    <Menu.RadioItemIndicator>
                      <CheckIcon aria-hidden="true" />
                    </Menu.RadioItemIndicator>
                  </span>
                  {LOCALE_NAMES[locale]}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item
              disabled={signingOut}
              onClick={() => startSignOut(() => signOut())}
              className={itemClass}
            >
              <LogOutIcon aria-hidden="true" />
              {t("signOut")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
