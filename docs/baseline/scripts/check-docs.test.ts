import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, test } from "vitest";
import { checkDoc, checkDocs } from "./check-docs";

function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "docs-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const root = project({
  "src/shared/config/env.ts": "",
  "docs/guide.md": "",
  "docs/baseline/README.md": "",
});

test("passes links, imports and paths that exist", () => {
  const text = [
    "@docs/guide.md",
    "See [the guide](docs/guide.md#setup) and [docs](https://example.com).",
    "Add it to `src/shared/config/env.ts:3`. Routes like `api/agent/plan.json` aren't paths.",
  ].join("\n");
  expect(checkDoc(root, "AGENTS.md", text)).toEqual([]);
});

test("flags links, imports and file paths that don't exist", () => {
  const text = [
    "@docs/gone.md",
    "Read [it](./missing.md).",
    "Edit `src/shared/config/old.ts`.",
  ].join("\n");
  expect(checkDoc(root, "docs/guide.md", text)).toEqual([
    "docs/guide.md:1: @docs/gone.md not found",
    "docs/guide.md:2: ./missing.md not found",
    "docs/guide.md:3: `src/shared/config/old.ts` not found",
  ]);
});

test("skips code blocks, folders, placeholders and baseline examples", () => {
  const text = [
    "```md",
    "[gone](gone.md)",
    "```",
    "Don't create `src/pages`. Name it `src/views/<slice>/index.ts`.",
  ].join("\n");
  expect(checkDoc(root, "docs/guide.md", text)).toEqual([]);
  expect(
    checkDoc(root, "docs/baseline/README.md", "Copy `src/app/page.tsx`."),
  ).toEqual([]);
});

test("reads AGENTS.md and every doc under docs/", () => {
  const broken = project({
    "AGENTS.md": "Read `docs/rules.md`.",
    "docs/a.md": "[b](b.md)",
  });
  expect(checkDocs(broken)).toEqual([
    "AGENTS.md:1: `docs/rules.md` not found",
    "docs/a.md:1: b.md not found",
  ]);
});
