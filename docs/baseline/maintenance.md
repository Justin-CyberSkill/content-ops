# Maintenance

How we keep projects healthy and this folder current.

## A healthy project

- `pnpm check` and CI pass on `main`.
- Nothing unused: when a change makes code, a dependency, an env var, a message or a doc unused, the same change removes it. Knip catches files, exports and dependencies. If it flags something used in a way it can't see, make a type-only file `.d.ts`, or add the narrowest `ignore` to `knip.json`.
- One source for each fact: env keys in `.env.example`, fixed lists in one `as const` array, words in the message files, rules in `docs/`.
- `docs/decisions.md` lists every difference from this baseline, with its date and reason. Remove an entry when it stops being true.
- `AGENTS.md` holds only commands and pointers. Anything an agent needs for one kind of task lives in the doc for that task.
- No TODO, commented-out code or "temporary" files on `main`. Track work in issues.

## Upgrading dependencies

- Monthly: `pnpm outdated`. Take patches and minors together; run `pnpm check && pnpm build`.
- Majors one at a time, each on its own branch. Read the upgrade guide first. Next.js: `pnpm dlx @next/codemod upgrade major`.
- A major that changes a baseline pick or rule also changes this folder. See below.

## Updating a project to the latest baseline

1. Replace `docs/baseline/` with the reference project's copy.
2. Read "Changes" below for everything newer than your copy's version (top of `README.md`).
3. Run `pnpm install && pnpm check` and fix what fails.
4. Drop entries in `docs/decisions.md` that the baseline now covers.

## Changing the baseline

Change it when:
- a project hits a problem the baseline should have prevented,
- two projects need the same decision (promote it from `docs/decisions.md`),
- a major release or a better tool changes a pick in [stack.md](stack.md),
- or at the quarterly review: are the picks still recommended, and does every rule still earn its place?

How:
1. Make the change in the reference project, on a branch, with the person's approval for anything in [stack.md](stack.md).
2. Keep scripts and their tests passing: `pnpm check`.
3. Bump the version date in [README.md](README.md) and add a line under "Changes" below.

## Writing rules for this folder

- Each fact lives in one file. Link to it; don't restate it.
- Write rules, not essays. Give a reason only when it stops a wrong "fix".
- Add an example only when it prevents a mistake.
- Keep each file under about 120 lines (`starter.md` holds templates read once, so it may run longer). When one grows, split it by the task that reads it, and add it to the table in [README.md](README.md).
- No facts about one project. The only project named is the reference project.

## Changes

- 2026-10-24: first version, from `content-ops`.
