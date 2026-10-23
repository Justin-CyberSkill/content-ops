import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { env } from "@/shared/config";
import { db } from "@/shared/db";
import { ac, roles } from "./roles";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  // Invite-only: admins create members from the admin page, nobody signs up.
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [
    admin({ ac, roles, defaultRole: "member", adminRoles: ["admin"] }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
