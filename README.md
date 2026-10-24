# CS Content Ops

Next.js 16 App Router app.

## Setup

Requires Node 22.18+ and pnpm 10.

```bash
pnpm install
pnpm env:sync .env.local     # creates it from .env.example; fill in BETTER_AUTH_SECRET
pnpm db:migrate
pnpm db:seed-admin           # first admin from ADMIN_EMAIL; prints a temporary password
pnpm dev
```

## Scripts

| Script                                          | What it does                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev` / `build` / `start`                  | Next.js                                                                                    |
| `pnpm check`                                    | Lint, typecheck and tests: run before finishing any change                                 |
| `pnpm lint` / `format`                          | Biome, Knip (unused code), and the baseline's structure and docs checks / Biome with fixes |
| `pnpm typecheck`                                | Route types + `tsc --noEmit`                                                               |
| `pnpm test` / `test:watch`                      | Vitest unit tests                                                                          |
| `pnpm env:sync` / `env:check`                   | Align `.env*` files with `.env.example` (order, missing keys) / report only                |
| `pnpm db:generate` / `db:migrate` / `db:studio` | drizzle-kit                                                                                |
| `pnpm db:seed-admin`                            | Create the first admin from `ADMIN_EMAIL`, or promote that user to admin                   |
| `pnpm auth:generate`                            | Regenerate the Better Auth schema after changing auth plugins                              |

## Docs

- [docs/baseline](docs/baseline/README.md): shared stack, structure, rules and scripts, also used to start new projects
- [docs/decisions.md](docs/decisions.md): where this project differs from the baseline
- [docs/deploy.md](docs/deploy.md): first production deploy to Vercel and Neon
- [docs/ux-guidelines](docs/ux-guidelines/index.md): screens, flows and words
