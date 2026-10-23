import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/shared/auth/index.server";
import { getContent, listMembers } from "../api/queries";
import { emptyContentForm, toFormValues } from "../model/content-form";
import { ContentForm } from "./content-form";
import { DeleteContentButton } from "./delete-content-button";

export const newMetadata: Metadata = { title: "New content · CS Content Ops" };
export const editMetadata: Metadata = {
  title: "Edit content · CS Content Ops",
};

const loading = <p className="text-muted-foreground">Loading…</p>;

export function NewContentPage() {
  return (
    <Shell title="New content">
      <Suspense fallback={loading}>
        <NewContentForm />
      </Suspense>
    </Shell>
  );
}

export function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Shell title="Edit content">
      <Suspense fallback={loading}>
        <EditContentForm params={params} />
      </Suspense>
    </Shell>
  );
}

function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      {children}
    </main>
  );
}

async function NewContentForm() {
  await requireUser();
  const members = await listMembers();
  return <ContentForm id={null} initial={emptyContentForm} members={members} />;
}

async function EditContentForm({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, me] = await Promise.all([params, requireUser()]);
  const [item, members] = await Promise.all([getContent(id), listMembers()]);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-8">
      <ContentForm
        id={item.id}
        initial={toFormValues(item)}
        members={members}
      />
      {me.role === "admin" ? (
        <div className="border-t pt-6">
          <DeleteContentButton id={item.id} />
        </div>
      ) : null}
    </div>
  );
}
