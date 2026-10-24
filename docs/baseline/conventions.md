# Conventions

How to write code on the baseline. Where code goes: [architecture.md](architecture.md).

## Code

- TypeScript strict, no `any`. Derive types from their source: `z.output<typeof schema>`, `typeof table.$inferSelect`, `(typeof LIST)[number]`.
- A fixed list is one `as const` array shared by the DB enum, Zod and the UI:

  ```ts
  export const PLATFORMS = ["facebook", "tiktok"] as const;
  export type Platform = (typeof PLATFORMS)[number];
  export const platform = pgEnum("platform", PLATFORMS);
  ```
- Named exports only. Route files re-export a view `as default`.
- kebab-case files and folders, PascalCase components, UPPER_SNAKE_CASE module constants.
- Comments say why, in one line. Add `/** … */` to an export only when its name doesn't say enough.
- Pass the clock, time zone and translator in (`todayIn(TEAM_TIME_ZONE)`, `createSchema(t)`), so logic stays pure and testable.

## Reads

A page renders its frame at once and reads data in an async child inside `<Suspense>`:

```tsx
export function OrdersPage() {
  return (
    <main>
      <h1>Orders</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <OrderList />
      </Suspense>
    </main>
  );
}

async function OrderList() {
  await requireUser();
  return <OrderTable rows={await listOrders()} />;
}
```

## Mutations

Server Actions sit in a slice's `api/`, in a file starting with `"use server"`. Each one, in order:
1. Checks the caller: `requireUser()` or `requireAdmin()`.
2. Validates input with Zod `safeParse`.
3. Checks rules that depend on data inside the `where` clause where possible, so check and write can't race.
4. Writes, then `refresh()` or `redirect()`.
5. Returns `{ error }` with a message a person can act on, or `{}`. Expected failures don't throw.

Forms use `useActionState`. A form's logic lives in `model/<thing>-form.ts`: a schema factory taking the translator, `read<Thing>Form(formData)` and `toFormValues(row)`, so a failed submit refills the form.

## Route handlers

For webhooks and machine clients only. Authenticate, validate with Zod, answer JSON: `400` with `issues: [{ field, message }]`, `401` for a bad credential, `429` with `Retry-After`.

## Environment

- `.env.example` lists every key with a comment and a safe default or nothing. `.env*` files other than it are git-ignored.
- `src/shared/config/env.ts` parses `process.env` with Zod. App code reads `env`; only scripts and config files read `process.env`.
- New key: add it to both, then `pnpm env:sync`.

## Database

- Schema in `src/shared/db/schema/`, one file per domain, re-exported from `index.ts`. `casing: "snake_case"`, so TypeScript stays camelCase.
- Change the schema, `pnpm db:generate`, read the SQL, commit it. Never edit an applied migration. CI migrates production after `main` passes.
- Moments in UTC (`timestamp().defaultNow()`). Days and times people pick (`date()`, `time()`) as given. "Today" and displayed times use one team time zone from `shared/config`.
- Better Auth owns its tables: after changing plugins, `pnpm auth:generate`, then `pnpm db:generate`.

## UI

- Components come from `src/shared/ui`; change them there. Add each with `pnpm dlx shadcn@latest add <name>` when a view first needs it. Before the first: `pnpm dlx shadcn@latest init -d` (base-nova on Base UI), set the `components.json` aliases ([starter.md](starter.md#componentsjson-aliases)), and move anything it puts in `src/components` or `src/lib` to `src/shared/`.
- Colors, radii and shadows are tokens in `globals.css`. No hard-coded colors.
- Icon-only buttons get `aria-label`; decorative icons `aria-hidden="true"`.
- Each project keeps its own UX rules in its docs.

## Git

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`. The subject says what a person gets: `feat: comments on each content item`.
- One change per commit, on a branch, merged by PR when CI is green.
- Commit the block `next dev` writes into `AGENTS.md` as it is; removing it only brings it back.

## Agents

- `AGENTS.md` is the entry point; `CLAUDE.md` is one line, `@AGENTS.md`. Keep `AGENTS.md` to commands and "read X before you Y" pointers.
- `.claude/launch.json` starts the dev server. Skills for the app's own API live in `.claude/skills/<name>/SKILL.md`.
- Finish every change with `pnpm format && pnpm check`. Biome formats Markdown too.
