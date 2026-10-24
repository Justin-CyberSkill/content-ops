# Stack

Verified 2026-10-24. Exact versions live in each project's `package.json`. A project that needs something else records it in `docs/decisions.md` after approval.

| Need            | Pick                                         | Notes                                                                                 |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router, TypeScript strict     | Cache Components on. Read `node_modules/next/dist/docs/` before writing Next.js code. |
| Styling         | Tailwind CSS v4                              | Tokens as CSS variables in `src/app/globals.css`.                                     |
| UI components   | shadcn/ui on Base UI                         | Copied into `src/shared/ui`; our code from then on.                                   |
| Database        | Postgres: Neon in production, Docker locally | Standard Postgres only.                                                               |
| ORM             | Drizzle ORM + drizzle-kit, `postgres` driver | SQL migrations committed in `drizzle/`.                                               |
| Auth            | Better Auth                                  | Users in our Postgres.                                                                |
| Validation      | Zod v4                                       | All external input and env.                                                           |
| Lint and format | Biome                                        | Formats Markdown too. Shared config: [biome-base.jsonc](biome-base.jsonc).            |
| Tests           | Vitest + Testing Library, jsdom              | See [testing.md](testing.md).                                                         |
| Runtime         | Node 22.18+, pnpm 10                         | Node runs the `.ts` scripts directly.                                                 |
| Hosting and CI  | Vercel (Node.js runtime), GitHub Actions     |                                                                                       |
| Structure       | Feature-Sliced Design v2.1                   | See [architecture.md](architecture.md).                                               |

Not in the baseline: e2e tests, background jobs, payments, email, file storage, error tracking. Optional modules with a proven setup: [i18n](recipes/i18n.md), [agent API](recipes/agent-api.md).

## Choosing tech

Research current options in official docs and recent independent sources, not memory. Pick by:
1. Free or open source (a generous free tier is fine)
2. Maintained and recommended today
3. Lean: few dependencies, little setup
4. TypeScript-first and well documented
5. Portable, with no hard lock-in

Suggest one pick with a short reason, the main alternative and any cost. After approval, record it in `docs/decisions.md`, or here when every project should use it.
