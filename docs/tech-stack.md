# Tech stack

Reference stack (verified 2026-10-14). A starting point, not a rule.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS v4
- shadcn/ui (copied into the repo)
- Postgres on Neon (standard Postgres only)
- Drizzle ORM + drizzle-kit
- Better Auth (users in our Postgres)
- Zod v4 (validate all external input)
- Server Actions for mutations, Route Handlers for webhooks and public endpoints, reads in Server Components
- Biome (lint + format)
- Vitest + Testing Library, Playwright
- GitHub Actions
- pnpm
- Feature-Sliced Design v2.1 on the App Router; boundaries enforced with Biome `noRestrictedImports`

Not in the baseline: hosting, background jobs, payments, email, storage, error tracking, i18n. Choose them when a project needs them.

## Choosing tech

For anything not listed, or something better than what is listed, research current options (official docs and recent independent sources, not memory). Pick by:
- Free or open-source (a generous free tier is fine)
- Actively maintained and recommended by the community today
- Fast and lean: few dependencies, small footprint, minimal setup
- Simple, elegant, TypeScript-first API that is well documented
- Fits the stack and stays portable (no hard lock-in)

Suggest one pick with a short reason, the main alternative and any cost. After approval, use it and update this file.
