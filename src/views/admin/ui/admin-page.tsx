import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth, requireAdmin } from "@/shared/auth/index.server";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { CreateMemberForm } from "./create-member-form";
import { ResetPasswordButton } from "./reset-password-button";

export const metadata: Metadata = { title: "Members · CS Content Ops" };

export function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          Add teammates here. Each gets a temporary password to change after
          signing in.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Members />
      </Suspense>
    </main>
  );
}

async function Members() {
  const me = await requireAdmin();
  const { users } = await auth.api.listUsers({
    query: { limit: 500, sortBy: "createdAt", sortDirection: "asc" },
    headers: await headers(),
  });

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Add a member</h2>
        <CreateMemberForm />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Team ({users.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Password</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "outline"}
                  >
                    {user.role === "admin" ? "Admin" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.id === me.id ? (
                    <span className="text-muted-foreground text-sm">You</span>
                  ) : (
                    <ResetPasswordButton userId={user.id} email={user.email} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
