# Architecture

[Feature-Sliced Design](https://fsd.how) v2.1 on the Next.js App Router. `pnpm lint` checks every rule marked ✓.

## Layers, high to low

```
src/
  app/               Next.js App Router and the FSD app layer: layouts, route files, globals.css, providers
  views/<slice>/     one slice per screen: its UI, reads, actions and state
  features/<slice>/  user actions used by several screens
  entities/<slice>/  domain models used by several screens
  shared/<segment>/  infrastructure with no business rules: ui, lib, config, db, auth
proxy.ts, instrumentation.ts   next to app/
```

- ✓ Only these folders. No `widgets`, and no `src/pages`: Next.js reads it as the Pages Router, so the FSD pages layer is `views`.
- Create `features` and `entities` only with their first slice.

## Imports

- ✓ Import only from lower layers, never between slices of one layer. Inside a slice, use relative imports.
- ✓ Import a slice through its public API: `@/views/home`, or `@/views/review/index.server` for server-only code (DB, secrets, Better Auth server). Never `@/views/home/ui/home-page`.
- ✓ Import `shared` by segment (`@/shared/db`) or by module (`@/shared/ui/button`, `@/shared/db/schema`). One entry per module keeps client bundles free of server code.

## Slices

- ✓ Each slice has `index.ts` or `index.server.ts`, and its code sits in segments:

  | Segment   | Holds                                             |
  | --------- | ------------------------------------------------- |
  | `ui/`     | components, including the page component          |
  | `model/`  | Zod schemas, types, pure logic                    |
  | `api/`    | Server Actions, DB reads, route handler functions |
  | `lib/`    | small helpers such as formatting                  |
  | `config/` | constants                                         |

- ✓ Name files by what they are for (`model/order.ts`, `api/list-orders.ts`), never `utils`, `helpers`, `types`, `common`, `components` or `hooks`.

## Placement

1. Put new code in the view that uses it. Duplication between views is fine.
2. ✓ Move it to `features` or `entities` only when several slices use it now, it has its own reason to change, and one focused job. A feature or entity used by fewer than two slices fails lint.
3. Infrastructure with no product rules goes to `shared`. Plain DB queries go in `shared/db`. CRUD is not an entity.
4. When unsure, keep it in the view.

Two slices on one layer need each other? In order: merge them, move the shared part down a layer, or compose both from the layer above with props. For `entities` only, last resort: an `@x` API (`entities/a/@x/b.ts`) with a comment saying why. `// biome-ignore lint/style/noRestrictedImports: <reason>` only with a reason a reviewer can check.

## Routes

Route files only re-export. Layouts and route handlers may hold app-wide wiring.

```ts
// src/app/profile/page.tsx
export { ProfilePage as default, generateMetadata } from "@/views/profile";
// src/app/api/orders/route.ts
export { listOrders as GET } from "@/views/orders/index.server";
```

- Routes that share a shell go in a route group, `app/(app)/layout.tsx`, with its own components in `app/(app)/_ui/`.

## Data and auth

- Read in Server Components, mutate with Server Actions, use Route Handlers for webhooks and machine clients.
- Cache Components is on: read the session or `headers()` inside `<Suspense>`, never at the top of a layout.
- `proxy.ts` only checks that a session cookie exists; every page, action and route handler checks the session itself. Import only small, dependency-free modules into it.
