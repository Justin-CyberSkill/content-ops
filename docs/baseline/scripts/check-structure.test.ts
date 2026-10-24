import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, test } from "vitest";
import { checkStructure } from "./check-structure";

/** A temp project with these files under src/. */
function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "structure-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, "src", path)), { recursive: true });
    writeFileSync(join(root, "src", path), text);
  }
  return root;
}

const valid = {
  "proxy.ts": "",
  "app/page.tsx": 'export { HomePage as default } from "@/views/home";',
  "views/home/index.ts": 'export { HomePage } from "./ui/home-page";',
  "views/home/ui/home-page.tsx": 'import { Badge } from "@/entities/order";',
  "views/orders/index.server.ts": 'export * from "./api/list";',
  "views/orders/api/list.ts": 'import { Badge } from "@/entities/order";',
  "entities/order/index.ts": 'export { Badge } from "./ui/badge";',
  "entities/order/ui/badge.tsx": "",
  "shared/ui/button.tsx": "",
};

test("passes a project that follows the layout", () => {
  expect(checkStructure(project(valid))).toEqual([]);
});

test("flags folders that aren't layers, and files outside slices", () => {
  expect(
    checkStructure(
      project({
        ...valid,
        "widgets/header/index.ts": "",
        "shared/format.ts": "",
        "views/home/home-page.tsx": "",
      }),
    ),
  ).toEqual([
    "src/widgets: not a layer (app, views, features, entities, shared). Move it into one.",
    "src/views/home/home-page.tsx: move it into a segment.",
    "src/shared/format.ts: move it into a segment folder.",
  ]);
});

test("flags missing public APIs, unknown segments and role names", () => {
  expect(
    checkStructure(
      project({
        ...valid,
        "views/home/components/card.tsx": "",
        "views/home/lib/utils.ts": "",
        "views/about/ui/about-page.tsx": "",
      }),
    ),
  ).toEqual([
    'src/views/home/components: name it by what it\'s for, not "components".',
    'src/views/home/lib/utils.ts: name it by what it\'s for, not "utils.ts".',
    "src/views/about: add an index.ts that exports its public API.",
    "src/views/home/components: not a segment (ui, model, api, lib, config).",
  ]);
});

test("flags features and entities that fewer than two slices use", () => {
  expect(
    checkStructure(
      project({
        ...valid,
        "views/orders/api/list.ts": "",
        "features/unused/index.ts": "",
        "features/unused/ui/x.tsx": "",
        // Tests don't count as users.
        "views/orders/ui/x.test.tsx": 'import { X } from "@/features/unused";',
      }),
    ),
  ).toEqual([
    "src/features/unused: nothing imports it. Delete it.",
    "src/entities/order: only views/home uses it. Move it into that slice.",
  ]);
});
