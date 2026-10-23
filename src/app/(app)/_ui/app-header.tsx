import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/shared/auth/index.server";
import { Button } from "@/shared/ui/button";
import { signOut } from "./sign-out";

const links = [{ href: "/", label: "Home" }] as const;

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          CS Content Ops
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Suspense>
            <AdminLink />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Suspense>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function AdminLink() {
  const session = await getSession();
  if (session?.user.role !== "admin") return null;
  return (
    <Link href="/admin" className="text-muted-foreground hover:text-foreground">
      Members
    </Link>
  );
}

async function UserMenu() {
  const session = await getSession();
  if (!session) return null;
  return (
    <>
      <Link
        href="/account"
        className="text-muted-foreground hover:text-foreground"
      >
        {session.user.name}
      </Link>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </>
  );
}
