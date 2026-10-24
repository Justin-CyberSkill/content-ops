<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

- Finish every change with `pnpm format && pnpm check`.
- Shared rules live in `docs/baseline/`; never edit it for this project. Where this project differs: `docs/decisions.md`.
- Structure is Feature-Sliced Design. Put new code in the view that uses it; server-only exports go in `index.server.ts`.
- Read before you:
  - add a slice, move code, or fix a structure or import error: `docs/baseline/architecture.md`
  - write code: `docs/baseline/conventions.md`; tests: `docs/baseline/testing.md`
  - add a dependency: `docs/baseline/stack.md`
  - upgrade dependencies or clean up: `docs/baseline/maintenance.md`
  - add or change a screen or its wording: `docs/ux-guidelines/index.md`, which says what else to read
- New env var: add it to `.env.example` and `src/shared/config/env.ts`, then run `pnpm env:sync`.
