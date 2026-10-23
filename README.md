# CS Content Ops

Next.js 16 App Router app.

## Setup

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm env:sync .env.local     # creates it from .env.example; fill in BETTER_AUTH_SECRET
pnpm db:migrate
pnpm db:seed-admin           # first admin from ADMIN_EMAIL; prints a temporary password
pnpm dev
```

## Scripts

| Script                                          | What it does                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `pnpm dev` / `build` / `start`                  | Next.js                                                                     |
| `pnpm lint` / `format`                          | Biome check / check with fixes                                              |
| `pnpm typecheck`                                | Route types + `tsc --noEmit`                                                |
| `pnpm test` / `test:watch`                      | Vitest unit tests (`src/**/*.test.tsx`)                                     |
| `pnpm env:sync` / `env:check`                   | Align `.env*` files with `.env.example` (order, missing keys) / report only |
| `pnpm db:generate` / `db:migrate` / `db:studio` | drizzle-kit                                                                 |
| `pnpm db:seed-admin`                            | Create the first admin from `ADMIN_EMAIL`, or promote that user to admin    |
| `pnpm auth:generate`                            | Regenerate the Better Auth schema after changing auth plugins               |

## Docs

- [docs/architecture.md](docs/architecture.md): folder layout, import rules, where code goes
- [docs/tech-stack.md](docs/tech-stack.md): the stack and how to choose new tech
