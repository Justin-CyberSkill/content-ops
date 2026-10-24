import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TEAM_TIME_ZONE } from "@/shared/config";
import { planRangeSchema } from "../model/plan-range";
import {
  ideaFilterSchema,
  MARKDOWN_GUIDE,
  PROPOSAL_STATES,
  proposalInputSchema,
  proposalUpdateFields,
  proposalUpdateSchema,
  withdrawInputSchema,
} from "../model/proposal-input";
import { authenticate } from "./authenticate";
import {
  type AgentKey,
  getIdea,
  type IdeaRefusal,
  listIdeas,
  listPlanForAgent,
  proposeContent,
  updateIdea,
  withdrawIdea,
} from "./ideas";

const reply = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const fail = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

function refused(refusal: IdeaRefusal) {
  return refusal.reason === "not_found"
    ? fail("No idea has that id.")
    : fail(`This idea is ${refusal.state}. Only pending ideas can change.`);
}

const idField = { id: z.string().describe("The idea's id.") };

/**
 * The same actions as the REST API, as MCP tools. A new server per request keeps it
 * stateless, which suits serverless functions: every call carries its own key.
 */
function createServer(key: AgentKey) {
  const server = new McpServer(
    { name: "content-ops", version: "1.0.0" },
    {
      instructions: `CyberSkill's content plan. You propose ideas; an admin approves or rejects them. ${MARKDOWN_GUIDE}`,
    },
  );

  server.registerTool(
    "read_plan",
    {
      title: "Read the content plan",
      description: `Approved content between two days (YYYY-MM-DD, at most 92 days apart), so new ideas fill gaps instead of clashing. Defaults to today and the next 30 days. Days and times are the team's local time (${TEAM_TIME_ZONE}).`,
      inputSchema: {
        from: z.iso.date().optional().describe("First day, YYYY-MM-DD."),
        to: z.iso.date().optional().describe("Last day, YYYY-MM-DD."),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const range = planRangeSchema(new Date(), TEAM_TIME_ZONE).safeParse(args);
      if (!range.success) return fail(range.error.issues[0].message);
      return reply({
        timeZone: TEAM_TIME_ZONE,
        ...range.data,
        items: await listPlanForAgent(range.data),
      });
    },
  );

  server.registerTool(
    "list_ideas",
    {
      title: "List ideas",
      description:
        "Ideas agents proposed, newest first. Filter by state: pending (waiting for an admin), approved, rejected (read rejectionReason and don't repeat the mistake) or withdrawn. Use source to find an idea already based on a meeting, issue or PR before proposing a duplicate.",
      inputSchema: {
        state: z.enum(PROPOSAL_STATES).optional(),
        source: z
          .string()
          .optional()
          .describe("Only ideas whose sources include exactly this string."),
        mine: z.boolean().optional().describe("Only ideas from this key."),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async (args) => {
      const filter = ideaFilterSchema.safeParse(args);
      if (!filter.success) return fail(filter.error.issues[0].message);
      return reply({ ideas: await listIdeas(key, filter.data) });
    },
  );

  server.registerTool(
    "get_idea",
    {
      title: "Get an idea",
      description:
        "One idea with the team's comments on it (Markdown) and its history (proposed, updated, withdrawn, restored, approved, rejected).",
      inputSchema: idField,
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const idea = await getIdea(id);
      return idea ? reply(idea) : fail("No idea has that id.");
    },
  );

  server.registerTool(
    "propose_idea",
    {
      title: "Propose an idea",
      description:
        "Add a content idea as pending. An admin approves or rejects it in Content Ops. Only propose ideas the person you work with agreed to. Write goal and why in Markdown, and keep idea a short plain-text title. Explain in why what it's based on and why now, and list those meetings, issues or PRs in sources.",
      inputSchema: proposalInputSchema,
    },
    async (input) => reply(await proposeContent(key, input)),
  );

  server.registerTool(
    "update_idea",
    {
      title: "Update a pending idea",
      description:
        "Change a pending idea. Send only the fields to change; null clears publishDate or goldenTime. Approved, rejected and withdrawn ideas can't change. The admin sees what changed and who changed it.",
      inputSchema: proposalUpdateFields.extend(idField),
      annotations: { idempotentHint: true },
    },
    async ({ id, ...update }) => {
      const check = proposalUpdateSchema.safeParse(update);
      if (!check.success) return fail(check.error.issues[0].message);
      const result = await updateIdea(key, id, check.data);
      if (!result.ok) return refused(result);
      return reply({ ...result.idea, changed: result.changed });
    },
  );

  server.registerTool(
    "withdraw_idea",
    {
      title: "Withdraw a pending idea",
      description:
        "Take a pending idea out of the admin's Proposals, such as when the person drops it or it's replaced by a better one. Give a short reason. The admin can still see and restore it.",
      inputSchema: withdrawInputSchema.extend(idField),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ id, reason }) => {
      const result = await withdrawIdea(key, id, reason);
      return result.ok ? reply(result.idea) : refused(result);
    },
  );

  return server;
}

/** POST /api/mcp: MCP over Streamable HTTP, JSON responses, no sessions. */
export async function handleMcp(request: Request) {
  const key = await authenticate(request);
  if (key instanceof Response) return key;

  const server = createServer(key);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
