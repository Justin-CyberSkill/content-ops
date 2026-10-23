import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/shared/auth/index.server";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { db } from "@/shared/db";
import { user } from "@/shared/db/schema";
import { planRangeSchema } from "../model/plan-range";
import { proposalInputSchema } from "../model/proposal-input";
import {
  type AgentKey,
  listPlanForAgent,
  listProposalsForKey,
  proposeContent,
} from "./propose-content";

const KEY_HEADER = "x-api-key";

function problem(status: number, error: string, init?: ResponseInit) {
  return Response.json({ error }, { ...init, status });
}

/** The verified key, or the response to send back. Every call counts toward the key's rate limit. */
async function authenticate(request: Request): Promise<AgentKey | Response> {
  const key = request.headers.get(KEY_HEADER);
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

/** GET /api/agent/plan?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function getPlan(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const params = new URL(request.url).searchParams;
  const range = planRangeSchema(new Date(), TEAM_TIME_ZONE).safeParse({
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  if (!range.success) {
    return Response.json(
      {
        error: "Invalid range.",
        issues: z.flattenError(range.error).fieldErrors,
      },
      { status: 400 },
    );
  }
  return Response.json({
    timeZone: TEAM_TIME_ZONE,
    ...range.data,
    items: await listPlanForAgent(range.data),
  });
}

/** GET /api/agent/proposals: this key's proposals and what happened to them. */
export async function getProposals(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;
  return Response.json({ proposals: await listProposalsForKey(key.id) });
}

/** POST /api/agent/proposals: add one idea as "proposed". */
export async function postProposal(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const body = await request.json().catch(() => undefined);
  const parsed = proposalInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "The proposal didn't validate.",
        issues: parsed.error.issues.map((issue) => ({
          field:
            issue.code === "unrecognized_keys"
              ? issue.keys.join(", ")
              : issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }
  return Response.json(await proposeContent(key, parsed.data), {
    status: 201,
  });
}
