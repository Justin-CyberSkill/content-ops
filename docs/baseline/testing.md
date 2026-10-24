# Testing

Vitest + Testing Library in jsdom: fast unit tests on every push. No e2e in the baseline.
- Tests sit next to their file as `<file>.test.ts(x)`, under `src/`, `scripts/` or `docs/baseline/scripts/`.
- `pnpm test` runs them once, `pnpm test:watch` while you work. CI runs `pnpm check` and `pnpm build`.

## What to test, in order

1. `model/` and `lib/`: schemas, form parsing, grouping, dates, formatting. Most logic should live here.
2. `ui/` components: render with props and check what a person sees: text, roles, links and their `href`, empty states.
3. Scripts: export the pure part and test it; keep side effects in `main()`.

Don't test async Server Components or DB queries directly. Keep them thin and move decisions into `model/`.

## How

- Name tests after behaviour: `test("shows an empty state")`.
- Query like a person: `getByRole`, `getByText`, `getByLabelText`. No test ids or class names.
- Pass fixed dates and time zones in instead of mocking the clock.
- Schema factories take the translator, so tests pass `(key) => key` and assert on keys.
- Build test data as one full typed object and override fields with spreads.
- With i18n, render through `renderWithIntl` ([recipes/i18n.md](recipes/i18n.md)).
