# Starter files

Files [setup.md](setup.md) creates once. After setup they belong to the project. Replace `<name>` (kebab-case) and `<Project name>`. Skip the database or auth parts a project doesn't use.

## package.json

```json
"type": "module",
"engines": { "node": ">=22.18" },
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check && knip && node docs/baseline/scripts/check-structure.ts && node docs/baseline/scripts/check-docs.ts",
  "format": "biome check --write",
  "typecheck": "next typegen && tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "check": "pnpm lint && pnpm typecheck && pnpm test",
  "env:sync": "node docs/baseline/scripts/env-sync.ts",
  "env:check": "node docs/baseline/scripts/env-sync.ts --check",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "auth:generate": "node --env-file-if-exists=.env.local node_modules/auth/dist/index.mjs generate --config src/shared/auth/auth-server.ts --output src/shared/db/schema/auth.ts --yes"
}
```

## biome.jsonc

Set the `$schema` version to the installed Biome.

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.6.2/schema.json",
  // Shared rules from the baseline, including the import boundaries. Add project-only settings here.
  "extends": ["./docs/baseline/biome-base.jsonc"]
}
```

## First view

`src/app/page.tsx`: `export { HomePage as default } from "@/views/home";`

`src/views/home/index.ts`: `export { HomePage } from "./ui/home-page";`

`src/views/home/ui/home-page.tsx`

```tsx
export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight"><Project name></h1>
    </main>
  );
}
```

`src/views/home/ui/home-page.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { HomePage } from "./home-page";

test("shows the app's name", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { level: 1, name: "<Project name>" }),
  ).toBeInTheDocument();
});
```

## components.json aliases

```json
"aliases": {
  "components": "@/shared/ui",
  "ui": "@/shared/ui",
  "utils": "@/shared/lib/cn",
  "lib": "@/shared/lib",
  "hooks": "@/shared/lib"
}
```

## Environment

`.env.example`

```bash
# Neon (or any Postgres) connection string. Use the pooled URL from the Neon console.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/<name>
# Direct (non-pooler) Neon URL, used only by drizzle-kit for migrations. Leave empty locally.
DATABASE_URL_UNPOOLED=

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

`src/shared/config/env.ts` (and `index.ts`: `export { env } from "./env";`)

```ts
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

export const env = schema.parse(process.env);
```

## Database

`drizzle.config.ts`

```ts
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

// Migrations need a direct connection: DDL through Neon's pooler (PgBouncer) can fail.
// Falls back to DATABASE_URL when the unpooled URL is unset or not a URL (e.g. local Postgres).
const url = [process.env.DATABASE_URL_UNPOOLED, process.env.DATABASE_URL].find(
  (value) => value && URL.canParse(value),
);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/shared/db/schema",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url: url ?? "" },
});
```

`src/shared/db/db.ts` (and `index.ts`: `export { db } from "./db";`)

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/config";
import * as schema from "./schema";

function createClient() {
  return postgres(env.DATABASE_URL, {
    // Neon's pooled URL runs PgBouncer in transaction mode, which breaks prepared statements.
    prepare: false,
    // Each Vercel function instance holds its own pool; keep it small so Neon's connection limit holds.
    max: process.env.VERCEL ? 1 : 10,
  });
}

// Reuse one client across dev hot reloads instead of leaking a pool per reload.
const globalForDb = globalThis as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
```

`src/shared/db/schema/index.ts`: `export * from "./auth";` once `pnpm auth:generate` has written `auth.ts`; `export {};` until then.

## Auth

`src/shared/auth/auth-server.ts`

```ts
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/shared/config";
import { db } from "@/shared/db";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()], // must stay last
});
```

`src/shared/auth/index.server.ts`

```ts
// Server-only entry: keeps the DB and secrets out of the client graph.
export { auth } from "./auth-server";
```

`src/app/api/auth/[...all]/route.ts`

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/shared/auth/index.server";

export const { GET, POST } = toNextJsHandler(auth);
```

When the first view needs the signed-in user, add `session.ts` and export `getSession` and `requireUser` from `index.server.ts`:

```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth-server";

/** The signed-in user's session, or null. Call inside a `<Suspense>` boundary. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** The signed-in user. Redirects to the sign-in page when there is none. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}
```

Add a client (`createAuthClient()` from `better-auth/react`) only when a client component needs it.

## Vitest

`vitest.config.ts`

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["{src,scripts,docs/baseline/scripts}/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

`vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
```

## CI

`.github/workflows/ci.yml`. Without a database, drop the `DATABASE_URL` line and the `migrate` job.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      # Placeholders so the app builds; nothing in CI talks to a real database.
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/ci
      BETTER_AUTH_SECRET: ci-only-secret-at-least-32-characters-long
      BETTER_AUTH_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm build

  migrate:
    # Apply committed migrations to production after CI passes on main.
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: ci
    runs-on: ubuntu-latest
    timeout-minutes: 10
    concurrency:
      group: migrate-production
      cancel-in-progress: false
    env:
      # Neon direct (non-pooler) URL. Add it under Settings > Secrets and variables > Actions.
      DATABASE_URL_UNPOOLED: ${{ secrets.DATABASE_URL_UNPOOLED }}
    steps:
      - name: Skip when the production database secret is not set
        id: guard
        run: |
          if [ -z "$DATABASE_URL_UNPOOLED" ]; then
            echo "::notice::DATABASE_URL_UNPOOLED secret not set; skipping migrations."
            echo "skip=true" >> "$GITHUB_OUTPUT"
          fi
      - if: steps.guard.outputs.skip != 'true'
        uses: actions/checkout@v7
      - if: steps.guard.outputs.skip != 'true'
        uses: pnpm/action-setup@v6
      - if: steps.guard.outputs.skip != 'true'
        uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: pnpm
      - if: steps.guard.outputs.skip != 'true'
        run: pnpm install --frozen-lockfile
      - if: steps.guard.outputs.skip != 'true'
        run: pnpm db:migrate
```

## Agent files

`AGENTS.md`: keep the `nextjs-agent-rules` block create-next-app wrote, then add:

```md
## Project

- Finish every change with `pnpm format && pnpm check`.
- Shared rules live in `docs/baseline/`; never edit it for this project. Where this project differs: `docs/decisions.md`.
- Structure is Feature-Sliced Design. Put new code in the view that uses it; server-only exports go in `index.server.ts`.
- Read before you:
  - add a slice, move code, or fix a structure or import error: `docs/baseline/architecture.md`
  - write code: `docs/baseline/conventions.md`; tests: `docs/baseline/testing.md`
  - add a dependency: `docs/baseline/stack.md`
  - upgrade dependencies or clean up: `docs/baseline/maintenance.md`
- New env var: add it to `.env.example` and `src/shared/config/env.ts`, then run `pnpm env:sync`.
```

`CLAUDE.md`: `@AGENTS.md`

`.claude/launch.json`

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "port": 3000
    }
  ]
}
```

## Project docs

`docs/decisions.md`

```md
# Decisions

Where this project differs from [the baseline](baseline/README.md), newest last: what, the date it was approved, and why.
- None yet.
```

`README.md`

````md
# <Project name>

<What it is and who uses it.>

## Setup

Requires Node 22.18+ and pnpm 10.

```bash
pnpm install
pnpm env:sync .env.local   # creates it from .env.example; fill in the empty values
pnpm db:migrate
pnpm dev
```

`pnpm check` runs lint, typecheck and tests. Other scripts: [docs/baseline/README.md](docs/baseline/README.md#scripts) and `package.json`.

## Docs

- [docs/baseline](docs/baseline/README.md): shared stack, structure, rules and scripts
- [docs/decisions.md](docs/decisions.md): where this project differs
````
