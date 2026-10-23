import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { buttonVariants } from "@/shared/ui/button";
import { listContent } from "../api/list-content";
import { ContentTable } from "./content-table";

export const metadata: Metadata = { title: "Content plan · CS Content Ops" };

export function ContentListPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-semibold text-2xl tracking-tight">Content plan</h1>
        <Link href="/content/new" className={buttonVariants()}>
          New content
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ContentList />
      </Suspense>
    </main>
  );
}

async function ContentList() {
  await requireUser();
  return <ContentTable rows={await listContent()} />;
}
