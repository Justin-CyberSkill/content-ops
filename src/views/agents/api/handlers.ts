import { z } from "zod";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { planRangeSchema } from "../model/plan-range";
import {
  ideaFilterSchema,
  proposalInputSchema,
  proposalUpdateSchema,
  withdrawInputSchema,
} from "../model/proposal-input";
import { authenticate, problem } from "./authenticate";
import {
  getIdea,
  type IdeaRefusal,
  listIdeas,
  listPlanForAgent,
  proposeContent,
  updateIdea,
  withdrawIdea,
} from "./ideas";

type IdParams = { params: Promise<{ id: string }> };

/** A 400 that lists each field that failed and why. */
function invalid(error: string, issues: z.core.$ZodIssue[]) {
  return Response.json(
    {
      error,
      issues: issues.map((issue) => ({
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

/** The JSON body, or undefined when there's none or it isn't JSON. */
async function readJson(request: Request) {
  const text = await request.text();
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function refused(refusal: IdeaRefusal) {
  if (refusal.reason === "not_found")
    return problem(404, "No idea has that id.");
  return Response.json(
    {
      error: `This idea is ${refusal.state}. Only pending ideas can change.`,
      state: refusal.state,
    },
    { status: 409 },
  );
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

/** GET /api/agent/proposals?state=pending&source=…&mine=true&limit=50 */
export async function getProposals(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const params = new URL(request.url).searchParams;
  const filter = ideaFilterSchema.safeParse({
    state: params.get("state") ?? undefined,
    source: params.get("source") ?? undefined,
    mine: params.get("mine") === "true" || undefined,
    limit: params.has("limit") ? Number(params.get("limit")) : undefined,
  });
  if (!filter.success) return invalid("Invalid filter.", filter.error.issues);
  return Response.json({ proposals: await listIdeas(key, filter.data) });
}

/** POST /api/agent/proposals: add one idea as pending. */
export async function postProposal(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const parsed = proposalInputSchema.safeParse(await readJson(request));
  if (!parsed.success)
    return invalid("The proposal didn't validate.", parsed.error.issues);
  return Response.json(await proposeContent(key, parsed.data), {
    status: 201,
  });
}

/** GET /api/agent/proposals/:id: one idea with its comments and history. */
export async function getProposal(request: Request, { params }: IdParams) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const idea = await getIdea((await params).id);
  if (!idea) return problem(404, "No idea has that id.");
  return Response.json(idea);
}

/** PATCH /api/agent/proposals/:id: change a pending idea. Send only the fields to change. */
export async function patchProposal(request: Request, { params }: IdParams) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const parsed = proposalUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success)
    return invalid("The change didn't validate.", parsed.error.issues);
  const result = await updateIdea(key, (await params).id, parsed.data);
  if (!result.ok) return refused(result);
  return Response.json({ ...result.idea, changed: result.changed });
}

/** DELETE /api/agent/proposals/:id: withdraw a pending idea. Optional body: { "reason": "…" }. */
export async function deleteProposal(request: Request, { params }: IdParams) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const parsed = withdrawInputSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success)
    return invalid("The withdrawal didn't validate.", parsed.error.issues);
  const result = await withdrawIdea(key, (await params).id, parsed.data.reason);
  if (!result.ok) return refused(result);
  return Response.json(result.idea);
}
