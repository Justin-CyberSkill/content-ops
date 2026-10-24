# Baseline

The shared start for every project: stack, structure, rules, and the scripts that check them. Version 2026-10-24.

## Start a new project

Copy this folder into the new repo as `docs/baseline/`, then ask an agent:

> Follow `docs/baseline/setup.md`. Project: <name>, <what it is and who uses it>.

## Rules for this folder

- It is identical in every project. Never change it for one project: record the difference in `docs/decisions.md`.
- Improve it in the reference project (`cyberskill-official/content-ops`), then copy it to the others. See [maintenance.md](maintenance.md).
- Projects use it in place, not as a copy: `biome.jsonc` extends [biome-base.jsonc](biome-base.jsonc) and `package.json` runs [scripts](scripts) from here.

## Read when

| File                                         | Read it before you                                              |
| -------------------------------------------- | --------------------------------------------------------------- |
| [stack.md](stack.md)                         | add or replace a dependency                                     |
| [architecture.md](architecture.md)           | add a slice, move code, or fix a structure or import error      |
| [conventions.md](conventions.md)             | write code                                                      |
| [testing.md](testing.md)                     | write or fix tests                                              |
| [maintenance.md](maintenance.md)             | upgrade dependencies, clean up a project, or change this folder |
| [setup.md](setup.md)                         | start a new project                                             |
| [recipes/i18n.md](recipes/i18n.md)           | add a second UI language                                        |
| [recipes/agent-api.md](recipes/agent-api.md) | let agents read from or propose to the app                      |

## Scripts

| Command                       | Runs                                                               | Fails when                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                   | Biome, Knip, `scripts/check-structure.ts`, `scripts/check-docs.ts` | bad format or imports; a file, export or dependency nothing uses; a folder, name or slice breaks [architecture.md](architecture.md); a doc points at a missing file |
| `pnpm env:sync` / `env:check` | `scripts/env-sync.ts`                                              | a `.env*` file differs from `.env.example` (`env:sync` fixes it)                                                                                                    |
| `pnpm check`                  | lint, typecheck, tests                                             | anything above, a type error or a test. Run `pnpm format` first.                                                                                                    |

## Principles

- **Lean.** Add a dependency, layer, file or doc only when today's work needs it. Remove what a change makes unused in the same change.
- **One source for each fact.** Link to it; don't copy it.
- **Machines check the rules.** A rule that matters gets a check. A check nobody can pass gets fixed or removed, not ignored.
- **Portable.** Open-source tools and standard Postgres, no lock-in.
- **Agents propose, people decide.** Anything outside the repo needs a person's approval.
- **Short docs.** Agents read them on every task, so every line must change what an agent does.
