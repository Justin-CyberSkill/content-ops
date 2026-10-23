"use client";

import { Menu } from "@base-ui/react/menu";
import { ExternalLinkIcon, LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/shared/ui/button";
import { shortLink } from "../lib/format-day";

/** One small button per row instead of a column of links: opens the links in a menu. */
export function AssetLinksMenu({ links }: { links: string[] }) {
  const t = useTranslations("contentList");
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("assetLinks", { count: links.length })}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "relative z-10 gap-1.5 px-3 tabular-nums",
        })}
      >
        <LinkIcon aria-hidden="true" className="size-3.5" />
        {links.length}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className="flex max-w-80 flex-col gap-0.5 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-float outline-none">
            {links.map((link) => (
              <Menu.LinkItem
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium outline-none data-highlighted:bg-muted"
              >
                <ExternalLinkIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{shortLink(link)}</span>
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
