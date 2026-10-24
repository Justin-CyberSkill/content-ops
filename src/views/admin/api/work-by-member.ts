import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { memberWorkType, workType } from "@/shared/db/schema";

/** The kinds of work each member does, in workflow order, by user id. */
export async function listWorkByMember(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ userId: memberWorkType.userId, name: workType.name })
    .from(memberWorkType)
    .innerJoin(workType, eq(memberWorkType.workTypeId, workType.id))
    .orderBy(asc(workType.position), asc(workType.createdAt));
  const byMember = new Map<string, string[]>();
  for (const row of rows)
    byMember.set(row.userId, [...(byMember.get(row.userId) ?? []), row.name]);
  return byMember;
}
