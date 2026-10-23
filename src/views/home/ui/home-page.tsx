import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";

export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-10">
      <h1 className="font-semibold text-3xl tracking-tight">CS Content Ops</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  return <p className="text-muted-foreground">Welcome, {user.name}.</p>;
}
