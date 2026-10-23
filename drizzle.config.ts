import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

// Migrations need a direct connection: DDL through Neon's pooler (PgBouncer) can fail.
// Falls back to DATABASE_URL when the unpooled URL is unset or not a URL (e.g. local Postgres).
const url = [process.env.DATABASE_URL_UNPOOLED, process.env.DATABASE_URL].find(
  (value) => value && URL.canParse(value),
);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/shared/db/schema",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url: url ?? "" },
});
