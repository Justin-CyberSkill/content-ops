import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Account · CS Content Ops" };

export function AccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="font-semibold text-2xl tracking-tight">Account</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Profile />
      </Suspense>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Change password</h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}

async function Profile() {
  const user = await requireUser();
  return (
    <p className="text-muted-foreground text-sm">
      Signed in as {user.name} ({user.email}).
    </p>
  );
}
