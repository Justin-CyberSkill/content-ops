# Tech stack

Baseline shared across projects. Verified 2026-10-23. Versions live in `package.json`.
Stay on it. Any change needs approval and goes in "Project deviations".

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS v4
- shadcn/ui on Base UI (copied into the repo)
- Postgres: Neon in production, Docker locally. Standard Postgres only.
- Drizzle ORM + drizzle-kit (postgres-js driver)
- Better Auth (users in our Postgres)
- Zod v4 (validate all external input and env)
- Server Actions for mutations, Route Handlers for webhooks and public endpoints, reads in Server Components
- Biome (lint + format)
- Vitest + Testing Library
- Vercel (Node.js runtime)
- GitHub Actions
- pnpm
- Feature-Sliced Design v2.1, boundaries enforced by Biome

Not in the baseline: e2e, background jobs, payments, email, storage, error tracking, i18n. Choose when needed.

## Choosing tech

Research current options (official docs and recent independent sources, not memory). Pick by:
- Free or open-source (a generous free tier is fine)
- Actively maintained and recommended today
- Lean: few dependencies, minimal setup
- Simple, TypeScript-first, well documented
- Portable (no hard lock-in)

Suggest one pick with a short reason, the main alternative and any cost. After approval, record it below, or update the baseline if it should apply to every project.

## Project deviations

- i18n: next-intl, approved 2026-10-23. Vietnamese (default) and English; the choice lives in the `NEXT_LOCALE` cookie, no locale in the URL. Setup in `src/shared/i18n`.
