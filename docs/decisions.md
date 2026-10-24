# Decisions

Where this project differs from [the baseline](baseline/README.md), newest last: what, the date it was approved, and why.
- **i18n: next-intl**, 2026-10-23. Vietnamese (default) and English, following [the i18n recipe](baseline/recipes/i18n.md). Every route sits under `[locale]` (`/vi/content`), so each screen prerenders per language; the `NEXT_LOCALE` cookie remembers the choice.
- **Agent API keys: `@better-auth/api-key`** (MIT), 2026-10-23. Hashed, rate limited per key and made by admins under Agents. `/api/agent` and `/api/mcp` accept only keys an admin owns. `enableSessionForAPIKeys` stays off, so a key never acts as a signed-in user.
- **MCP server: `@modelcontextprotocol/sdk`** (MIT, the official TypeScript SDK), 2026-10-24. `/api/mcp` runs its Web Standard Streamable HTTP transport statelessly with JSON responses, so it fits a Vercel function. The package also lists Express and Hono as dependencies; we import neither.
