import { beforeEach, expect, test, vi } from "vitest";
import { proposeContent, updateIdea } from "./ideas";
import { handleMcp } from "./mcp";

vi.mock("@/shared/config", () => ({ TEAM_TIME_ZONE: "Asia/Ho_Chi_Minh" }));
vi.mock("./authenticate", () => ({
  authenticate: vi.fn(async () => ({ id: "key-1", name: "Claude planner" })),
}));
vi.mock("./ideas", () => ({
  getIdea: vi.fn(),
  listIdeas: vi.fn(async () => []),
  listPlanForAgent: vi.fn(async () => []),
  proposeContent: vi.fn(async () => ({ id: "new", state: "pending" })),
  updateIdea: vi.fn(),
  withdrawIdea: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

let nextId = 1;
async function call(method: string, params?: unknown) {
  const response = await handleMcp(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    }),
  );
  return (await response.json()) as { result: Record<string, unknown> };
}

const text = (result: Record<string, unknown>) =>
  (result.content as { text: string }[])[0].text;

test("offers the six idea tools", async () => {
  const { result } = await call("tools/list");
  expect((result.tools as { name: string }[]).map((tool) => tool.name)).toEqual(
    [
      "read_plan",
      "list_ideas",
      "get_idea",
      "propose_idea",
      "update_idea",
      "withdraw_idea",
    ],
  );
});

test("proposes an idea as the calling key", async () => {
  const { result } = await call("tools/call", {
    name: "propose_idea",
    arguments: {
      goal: "Grow sign-ups",
      idea: "Carousel: 5 phishing signs",
      platforms: ["instagram"],
      type: "carousel",
      why: "Phishing posts got 2x saves.",
    },
  });
  expect(result.isError).toBeUndefined();
  expect(proposeContent).toHaveBeenCalledWith(
    { id: "key-1", name: "Claude planner" },
    expect.objectContaining({ sources: [], assetLinks: [] }),
  );
});

test("refuses an update with nothing to change", async () => {
  const { result } = await call("tools/call", {
    name: "update_idea",
    arguments: { id: "abc" },
  });
  expect(result.isError).toBe(true);
  expect(text(result)).toBe("Send at least one field to change.");
  expect(updateIdea).not.toHaveBeenCalled();
});

test("says when an idea is no longer pending", async () => {
  vi.mocked(updateIdea).mockResolvedValueOnce({
    ok: false,
    reason: "not_pending",
    state: "approved",
  });
  const { result } = await call("tools/call", {
    name: "update_idea",
    arguments: { id: "abc", idea: "New idea" },
  });
  expect(result.isError).toBe(true);
  expect(text(result)).toBe(
    "This idea is approved. Only pending ideas can change.",
  );
});

test("tells agents to write the brief in Markdown and the title in plain text", async () => {
  const { result: init } = await call("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" },
  });
  expect(init.instructions).toContain("Markdown");

  const { result } = await call("tools/list");
  const propose = (
    result.tools as {
      name: string;
      inputSchema: { properties: Record<string, { description?: string }> };
    }[]
  ).find((tool) => tool.name === "propose_idea");
  const fields = propose?.inputSchema.properties;
  expect(fields?.goal.description).toContain("Markdown");
  expect(fields?.why.description).toContain("Markdown");
  expect(fields?.idea.description).toContain("plain text");
});
