import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/config";
import * as schema from "./schema";

function createClient() {
  return postgres(env.DATABASE_URL, {
    // Neon's pooled URL runs PgBouncer in transaction mode, which breaks prepared statements.
    prepare: false,
    // Each Vercel function instance holds its own pool; keep it small so Neon's connection limit holds.
    max: process.env.VERCEL ? 1 : 10,
  });
}

// Reuse one client across dev hot reloads instead of leaking a pool per reload.
const globalForDb = globalThis as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
