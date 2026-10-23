import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/shared/db";
import { content, user } from "@/shared/db/schema";

/** Dated content for the calendar. Proposed ideas only when `withProposed` (admins). */
export async function listCalendarItems({
  withProposed,
}: {
  withProposed: boolean;
}) {
  const dated = isNotNull(content.publishDate);
  return db
    .select({
      id: content.id,
      idea: content.idea,
      // Not null: filtered above.
      publishDate: content.publishDate,
      goldenTime: content.goldenTime,
      status: content.status,
      assigneeId: content.assigneeId,
      assigneeName: user.name,
    })
    .from(content)
    .leftJoin(user, eq(content.assigneeId, user.id))
    .where(withProposed ? dated : and(dated, ne(content.status, "proposed")))
    .orderBy(asc(content.publishDate), asc(content.goldenTime));
}
