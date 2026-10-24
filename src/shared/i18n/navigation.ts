import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Drop-in replacements for next/link and next/navigation that keep the language in the URL.
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
