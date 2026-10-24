# Recipe: agent API

Lets AI agents read from the app and propose to it, while people decide. Record it in `docs/decisions.md` when you add it.

## Rules

- **Agents propose, people decide.** Agent writes land in a waiting state (such as status `proposed`) and change nothing else. A person approves, edits, or rejects with a reason. Agents may change or withdraw only their own pending items.
- **Keys, not sign-ins.** `@better-auth/api-key`: hashed, rate limited per key, made by admins in the app. Keep `enableSessionForAPIKeys` off so a key never acts as the person who made it.
- **Only admin-made keys work.** Better Auth lets any signed-in user create a key, so the API checks that the key's owner is an admin.
- **Agents learn from decisions.** Return each proposal's state and rejection reason.

## Setup

1. `pnpm add @better-auth/api-key` and add `apiKey({ defaultPrefix: "<app>_", requireName: true, rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 30 } })` before `nextCookies()`. The prefix makes a leaked key easy to spot.
2. `pnpm auth:generate && pnpm db:generate`; read and commit the migration.
3. Add the waiting state and its trail to the domain table: who proposed it (key id and name), why, and when and by whom it was reviewed or rejected.
4. Add an `agents` view (admins create, disable and delete keys; a new key shows once) and a review view for waiting items.

## Endpoints

Route files under `src/app/api/` re-export handlers from the `agents` view's `index.server.ts`. Every handler:
1. **Authenticates**: the key from `x-api-key` or `Authorization: Bearer`, `auth.api.verifyApiKey`, then the owner's role. `401` with a plain reason, or `429` with `Retry-After`.
2. **Validates** with `z.strictObject`, so unknown fields fail: `400` with `issues: [{ field, message }]`. Messages in English; agents read them.
3. **Answers JSON** with only the fields an agent needs. Creating returns `201` with `{ id, state, createdAt }`.

Typical REST endpoints: read the plan for a capped date range, list this key's proposals with their state, create, update and withdraw a pending proposal.

## MCP

Agents such as Claude Code connect best over MCP. Use `@modelcontextprotocol/sdk` at `src/app/api/mcp/route.ts` (`POST` only). Per request: authenticate, create an `McpServer` with the same actions as REST tools, and answer through `WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined` and `enableJsonResponse: true`. Stateless, so it fits a serverless function.

## The agent's skill

A skill in `.claude/skills/<name>/SKILL.md` teaches the workflow: read past proposals and the plan first, agree ideas with the person, then propose with a clear "why", and report what was added. It names the MCP tools, gives a `curl` fallback per REST endpoint with fields and limits, and says what to do on `400`, `401` and `429`. Keys come from the environment or the MCP config, never from chat.
