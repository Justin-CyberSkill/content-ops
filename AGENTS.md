<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

- Verify before finishing: `pnpm lint && pnpm typecheck && pnpm test`.
- Structure is Feature-Sliced Design: `src/app` > `src/views` > `features` > `entities` > `shared`. Import only from lower layers, through a slice's `index.ts`. `pnpm lint` enforces this.
- Put new code in the view that uses it. Server-only exports go in `index.server.ts`.
- Read `docs/architecture.md` before you add a slice, move code, or fix an import-boundary lint error.
- Read `docs/tech-stack.md` before you add a dependency.
- Read `docs/ux-guidelines.md` before you add or change a screen or its wording.
- New env var: add it to `.env.example` and `src/shared/config/env.ts`, then run `pnpm env:sync`.
