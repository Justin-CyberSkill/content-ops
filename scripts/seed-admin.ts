/**
 * Create the first admin, or promote an existing user to admin.
 *
 *   pnpm db:seed-admin          reads ADMIN_EMAIL (and optional ADMIN_NAME) from .env.local
 *
 * Prints a temporary password once when it creates the sign-in. Change it from /account.
 * Runs outside Next.js, so it talks to Postgres directly instead of importing src/.
 */
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  ADMIN_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Set ADMIN_EMAIL to the first admin's email." })),
  ADMIN_NAME: z.string().optional(),
});

export type SeedConfig = { databaseUrl: string; email: string; name: string };

export function readSeedConfig(
  env: Record<string, string | undefined>,
): SeedConfig {
  const parsed = schema.parse(env);
  const email = parsed.ADMIN_EMAIL;
  return {
    databaseUrl: parsed.DATABASE_URL,
    email,
    name: parsed.ADMIN_NAME?.trim() || email.split("@")[0],
  };
}

/** Same id shape Better Auth generates by default. */
const newId = () => generateRandomString(32, "a-z", "A-Z", "0-9");

export const temporaryPassword = () =>
  generateRandomString(16, "a-z", "A-Z", "0-9");

async function main() {
  const config = readSeedConfig(process.env);
  const sql = postgres(config.databaseUrl, { prepare: false, max: 1 });
  try {
    const password = await sql.begin(async (tx) => {
      const [existing] = await tx<{ id: string }[]>`
        select id from "user" where email = ${config.email}`;
      const userId = existing?.id ?? newId();

      if (existing) {
        await tx`update "user" set role = 'admin', updated_at = now() where id = ${userId}`;
      } else {
        await tx`
          insert into "user" (id, name, email, email_verified, role)
          values (${userId}, ${config.name}, ${config.email}, true, 'admin')`;
      }

      const [credential] = await tx`
        select id from account where user_id = ${userId} and provider_id = 'credential'`;
      if (credential) return null;

      const plain = temporaryPassword();
      await tx`
        insert into account (id, account_id, provider_id, user_id, password, updated_at)
        values (${newId()}, ${userId}, 'credential', ${userId}, ${await hashPassword(plain)}, now())`;
      return plain;
    });

    console.log(`${styleText("green", "✓")} ${config.email} is an admin.`);
    if (password) {
      console.log(`  Temporary password: ${password}`);
      console.log("  Sign in, then change it on the Account page.");
    } else {
      console.log("  Password unchanged.");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      styleText(
        "red",
        error instanceof z.ZodError
          ? z.prettifyError(error)
          : String(error?.message ?? error),
      ),
    );
    process.exitCode = 1;
  });
}
