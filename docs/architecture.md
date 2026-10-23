# Architecture

Code in `src/` follows [Feature-Sliced Design](https://fsd.how) v2.1 on the Next.js App Router.

## Layers (high to low)

```
src/
  app/               App Router = FSD app layer: layouts, globals.css, providers, route handlers
  views/<slice>/     FSD pages layer: one slice per screen; owns its UI, data reads, actions, state
  features/<slice>/  reusable user actions
  entities/<slice>/  reusable domain models
  shared/<segment>/  infrastructure, no business rules: ui, lib, config, db, auth
```

- The pages layer is `views` because Next.js treats `src/pages` as a Pages Router folder.
- Do not create `widgets`.
- `proxy.ts` and `instrumentation.ts` sit in `src/`, next to `app/`.
- shadcn/ui components install into `src/shared/ui`.

## Import rules (enforced by `pnpm lint`)

- Import only from lower layers.
- No imports between slices on the same layer. Inside a slice, use relative imports.
- Import a slice through its `index.ts`: `@/views/home`, never `@/views/home/ui/home-page`.
- Import `shared` by segment (`@/shared/db`) or by a top-level module (`@/shared/ui/button`).
- Server-only exports (DB, secrets, Better Auth server) go in `index.server.ts`, not `index.ts`.

## Routes

Route files stay thin. A page re-exports its view. Layouts and route handlers may hold app-wide wiring.

```ts
// src/app/[locale]/profile/page.tsx  (every route sits under the language segment)
export { ProfilePage as default, metadata } from "@/views/profile";
```

## Placement

1. Put new code in the `views` slice that uses it. Duplication across views is fine.
2. Extract to `features` or `entities` only when all three hold: used in several places now, has its own reason to change, has one focused job.
3. Infrastructure with no product rules goes to `shared`. Plain DB queries go in `shared/db`. CRUD is not an entity.
4. When unsure, keep it in the view.

Segments inside a slice: `ui/`, `model/`, `api/`, `lib/`, `config/`.
Name files by domain (`model/order.ts`, `api/fetch-profile.ts`), not by role (`types.ts`, `utils.ts`).

## Same-layer cross-imports

Resolve in this order:
1. Merge the slices.
2. Move the shared part down a layer.
3. Compose both from the layer above, passing components or callbacks as props.

For `entities` only, the last resort is an `@x` public API (`entities/a/@x/b.ts`), with a comment that says why.
Use `// biome-ignore lint/style/noRestrictedImports: <reason>` only with a reason a reviewer can check.

## Data and auth

- Read data in Server Components. Mutate with Server Actions. Use Route Handlers for webhooks and public endpoints.
- Validate all external input with Zod.
- Cache Components is on. Read the session (`auth.api.getSession({ headers: await headers() })`) inside a `<Suspense>` boundary, not at the top of a layout.
