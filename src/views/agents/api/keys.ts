import { desc, eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { apikey, user } from "@/shared/db/schema";

/** Every agent key, newest first, with who made it. Never the key itself. */
export async function listAgentKeys() {
  return db
    .select({
      id: apikey.id,
      name: apikey.name,
      start: apikey.start,
      enabled: apikey.enabled,
      lastRequest: apikey.lastRequest,
      createdAt: apikey.createdAt,
      createdBy: user.name,
    })
    .from(apikey)
    .leftJoin(user, eq(apikey.referenceId, user.id))
    .orderBy(desc(apikey.createdAt));
}
