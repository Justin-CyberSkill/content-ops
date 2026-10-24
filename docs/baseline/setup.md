# Set up a new project

Steps for an agent, in order. Each ends with a check. File contents: [starter.md](starter.md). Add only what the first screen uses: UI components come with the first view that needs one ([conventions.md](conventions.md#ui)), so Knip finds nothing unused.

## 0. Agree the basics

In one message, confirm the project's name and purpose, whether it needs a database and sign-in now, and its UI languages. Say you will ask before anything outside the repo: a GitHub repo, Neon or Vercel projects, paid services, deploys.

## 1. Create the app

In the repo folder. create-next-app refuses a folder holding files such as `README.md`; `.git`, `.gitignore`, `LICENSE` and `docs/` are fine, so move others aside first.

```bash
pnpm create next-app@latest . --ts --tailwind --biome --app --src-dir \
  --cache-components --import-alias "@/*" --use-pnpm --agents-md --disable-git --yes
pnpm add -D -E @biomejs/biome@latest && pnpm add -D @types/node@22
```

The template pins an older Biome, which can't read `biome-base.jsonc`. Delete `public/*.svg` and the demo content of `src/app/page.tsx`. Add `type` and `engines` to `package.json` ([starter.md](starter.md#packagejson)). Read the guides in `node_modules/next/dist/docs/` for what you are about to write.

## 2. Wire the baseline

- Replace `biome.json` with `biome.jsonc` ([starter.md](starter.md#biomejsonc)), with the installed Biome version in `$schema`.
- Set the `package.json` scripts. Leave out `db:` and `auth:` without a database.
- Add the first view and its test ([starter.md](starter.md#first-view)).
- Vitest: `pnpm add -D vitest @vitejs/plugin-react vite jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom`, then `vitest.config.ts` and `vitest.setup.ts`.
- Knip: `pnpm add -D knip`. It needs no config.
- If pnpm lists ignored build scripts, add those packages to `ignoredBuiltDependencies` in `pnpm-workspace.yaml` unless they need their build.

Check: `pnpm format && pnpm check` passes.

## 3. Environment

`pnpm add zod`, create `.env.example` and `src/shared/config/` ([starter.md](starter.md#environment)), and add `!.env.example` under `.env*` in `.gitignore` (the template ignores it). Then `pnpm env:sync .env.local` and fill it in (`openssl rand -base64 32` for secrets). Check: `pnpm env:check`.

## 4. Database (skip if none)

```bash
pnpm add drizzle-orm postgres && pnpm add -D drizzle-kit @next/env
docker run -d --name <name>-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=<name> postgres:18
```

Create `drizzle.config.ts` and `src/shared/db/` ([starter.md](starter.md#database)). Check: `pnpm typecheck`.

## 5. Auth (skip if none)

```bash
pnpm add better-auth @better-auth/drizzle-adapter && pnpm add -D auth
```

Create `src/shared/auth/` and the auth route ([starter.md](starter.md#auth)), then `pnpm auth:generate`, export `./auth` from the schema index, `pnpm db:generate` and `pnpm db:migrate`. Add roles or invite-only sign-in only when asked. Check: the `user`, `session`, `account` and `verification` tables exist.

## 6. CI, agent files and docs

Create, from [starter.md](starter.md): `.github/workflows/ci.yml`, the `AGENTS.md` section, `CLAUDE.md`, `.claude/launch.json`, `README.md` and `docs/decisions.md`. For an optional module, follow its recipe and add it to `docs/decisions.md`.

## 7. Verify and hand over

`pnpm format && pnpm check && pnpm build`, then open `pnpm dev`. `next dev` rewrites the Next.js block in `AGENTS.md`; keep it. Commit as `chore: baseline project`. Ask before creating the remote, pushing, or setting up Neon and Vercel.

## Done when

- `pnpm check && pnpm build` pass, and the home route renders `@/views/home`.
- Importing `@/views/home/ui/home-page` from `src/app` fails `pnpm lint`.
- With a database: migrations are committed and apply to an empty database.
- `docs/baseline/` is unchanged.
