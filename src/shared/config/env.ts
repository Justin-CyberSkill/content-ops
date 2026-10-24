import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // Read only by scripts/seed-admin.ts; listed here so every env var is declared in one place.
  ADMIN_EMAIL: z.email().or(z.literal("")).optional(),
  ADMIN_NAME: z.string().optional(),
});

export const env = schema.parse(process.env);
