import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db";
import { content, user } from "@/shared/db/schema";

export async function getContent(id: string) {
  if (!z.uuid().safeParse(id).success) return undefined;
  return db.query.content.findFirst({ where: eq(content.id, id) });
}

export type Member = { id: string; name: string };

export async function listMembers(): Promise<Member[]> {
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(asc(user.name));
}
