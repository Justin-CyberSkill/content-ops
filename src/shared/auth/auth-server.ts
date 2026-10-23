import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { env } from "@/shared/config";
import { db } from "@/shared/db";
import { AGENT_KEY_PREFIX, AGENT_KEY_REQUESTS_PER_MINUTE } from "./agent-key";
import { ac, roles } from "./roles";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  // Invite-only: admins create members from the admin page, nobody signs up.
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [
    admin({ ac, roles, defaultRole: "member", adminRoles: ["admin"] }),
    // Agent keys, made by admins in Settings > Agents. A key only reaches /api/agent:
    // enableSessionForAPIKeys stays off, so it never signs in as the admin who made it.
    apiKey({
      defaultPrefix: AGENT_KEY_PREFIX,
      requireName: true,
      // Keep the prefix plus 4 characters, enough to tell keys apart in the list.
      startingCharactersConfig: {
        charactersLength: AGENT_KEY_PREFIX.length + 4,
      },
      maximumNameLength: 40,
      rateLimit: {
        enabled: true,
        timeWindow: 60_000,
        maxRequests: AGENT_KEY_REQUESTS_PER_MINUTE,
      },
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
