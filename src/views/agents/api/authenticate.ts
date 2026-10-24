import { eq } from "drizzle-orm";
import { auth } from "@/shared/auth/index.server";
import { db } from "@/shared/db";
import { user } from "@/shared/db/schema";
import type { AgentKey } from "./ideas";

const KEY_HEADER = "x-api-key";

/** The key from `x-api-key`, or from `Authorization: Bearer`, which many MCP clients send. */
function readKey(request: Request) {
  const key = request.headers.get(KEY_HEADER);
  if (key) return key;
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(
    " ",
  );
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export function problem(status: number, error: string, init?: ResponseInit) {
  return Response.json({ error }, { ...init, status });
}

/** The verified key, or the response to send back. Every call counts toward the key's rate limit. */
export async function authenticate(
  request: Request,
): Promise<AgentKey | Response> {
  const key = readKey(request);
  if (!key)
    return problem(401, `Send your agent key in the ${KEY_HEADER} header.`);

  const result = await auth.api.verifyApiKey({ body: { key } });
  if (result.valid && result.key) {
    // Better Auth lets any signed-in user make a key at /api/auth/api-key/create.
    // Only keys an admin made (in Settings > Agents) may use the agent API.
    const [owner] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, result.key.referenceId));
    if (owner?.role !== "admin") {
      return problem(401, "This key wasn't made by an admin.");
    }
    return { id: result.key.id, name: result.key.name ?? "Agent" };
  }
  if (result.error?.code === "RATE_LIMITED") {
    const details = (result.error as { details?: { tryAgainIn?: number } })
      .details;
    const seconds = Math.max(
      1,
      Math.ceil((details?.tryAgainIn ?? 60_000) / 1000),
    );
    return problem(429, "Too many requests for this key. Slow down.", {
      headers: { "Retry-After": String(seconds) },
    });
  }
  return problem(401, "This key is missing, wrong, disabled or expired.");
}
