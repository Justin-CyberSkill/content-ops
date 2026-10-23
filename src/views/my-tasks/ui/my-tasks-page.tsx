import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { listMyTasks } from "../api/list-my-tasks";
import { TaskList } from "./task-list";

export const metadata: Metadata = { title: "My tasks · CS Content Ops" };

export function MyTasksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">My tasks</h1>
        <p className="text-muted-foreground text-sm">
          Content assigned to you. Change the status as you go.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <MyTasks />
      </Suspense>
    </main>
  );
}

async function MyTasks() {
  const me = await requireUser();
  return <TaskList tasks={await listMyTasks(me.id)} />;
}
