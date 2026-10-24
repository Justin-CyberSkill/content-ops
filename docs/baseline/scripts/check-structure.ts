/**
 * Check that src/ follows the baseline layout (docs/baseline/architecture.md).
 * Biome checks imports; this checks what Biome can't: folders, names, public APIs,
 * and features or entities too little used to be their own slice.
 *
 *   pnpm lint    runs it after Biome
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";

const LAYERS = ["app", "views", "features", "entities", "shared"];
const SLICED = ["views", "features", "entities"];
const SEGMENTS = ["ui", "model", "api", "lib", "config"];
const PUBLIC_API = ["index.ts", "index.server.ts"];
/** Files Next.js expects next to app/. */
const ROOT_FILES = [
  "proxy.ts",
  "instrumentation.ts",
  "instrumentation-client.ts",
];
/** Names that say what code is, not what it's for. */
const ROLE_NAME =
  /^(utils?|helpers?|types|common|misc|components|hooks)(\..+)?$/;
const CODE = /\.(ts|tsx)$/;
const TEST = /\.test\.(ts|tsx)$/;
const IMPORT = /from\s+["']@\/(features|entities)\/([^/"']+)/g;

const isDir = (path: string) => statSync(path).isDirectory();
const list = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

function walk(dir: string): string[] {
  return list(dir).flatMap((name) => {
    const path = join(dir, name);
    return isDir(path) ? [path, ...walk(path)] : [path];
  });
}

/** "views/home" for src/views/home/ui/x.tsx, "app" for anything in src/app. */
function sliceOf(file: string): string {
  const [layer, slice] = file.split("/");
  return SLICED.includes(layer) ? `${layer}/${slice}` : layer;
}

/** Every problem in `root`/src, as one line each. */
export function checkStructure(root: string): string[] {
  const src = join(root, "src");
  const problems: string[] = [];

  for (const name of list(src)) {
    const dir = isDir(join(src, name));
    if (dir ? !LAYERS.includes(name) : !ROOT_FILES.includes(name)) {
      problems.push(
        `src/${name}: not a layer (${LAYERS.join(", ")}). Move it into one.`,
      );
    }
  }

  for (const path of walk(src)) {
    const name = path.split("/").pop() as string;
    if (ROLE_NAME.test(name)) {
      problems.push(
        `${relative(root, path)}: name it by what it's for, not "${name}".`,
      );
    }
  }

  for (const layer of SLICED) {
    for (const slice of list(join(src, layer))) {
      const dir = join(src, layer, slice);
      const at = `src/${layer}/${slice}`;
      if (!isDir(dir)) {
        problems.push(`${at}: files belong in a slice folder.`);
        continue;
      }
      const children = list(dir);
      if (!children.some((child) => PUBLIC_API.includes(child))) {
        problems.push(`${at}: add an index.ts that exports its public API.`);
      }
      for (const child of children) {
        const segment = isDir(join(dir, child));
        const allowed = segment
          ? SEGMENTS.includes(child) || (layer === "entities" && child === "@x")
          : PUBLIC_API.includes(child);
        if (!allowed) {
          problems.push(
            segment
              ? `${at}/${child}: not a segment (${SEGMENTS.join(", ")}).`
              : `${at}/${child}: move it into a segment.`,
          );
        }
      }
    }
  }

  for (const name of list(join(src, "shared"))) {
    if (!isDir(join(src, "shared", name))) {
      problems.push(`src/shared/${name}: move it into a segment folder.`);
    }
  }

  // A feature or entity earns its own slice only when several slices use it.
  const users = new Map<string, Set<string>>();
  for (const path of walk(src)) {
    if (!CODE.test(path) || TEST.test(path)) continue;
    const from = sliceOf(relative(src, path));
    for (const [, layer, slice] of readFileSync(path, "utf8").matchAll(
      IMPORT,
    )) {
      const target = `${layer}/${slice}`;
      if (target === from) continue;
      if (!users.has(target)) users.set(target, new Set());
      users.get(target)?.add(from);
    }
  }
  for (const layer of ["features", "entities"]) {
    for (const slice of list(join(src, layer))) {
      const id = `${layer}/${slice}`;
      const by = [...(users.get(id) ?? [])];
      if (by.length === 0) {
        problems.push(`src/${id}: nothing imports it. Delete it.`);
      } else if (by.length === 1) {
        problems.push(
          `src/${id}: only ${by[0]} uses it. Move it into that slice.`,
        );
      }
    }
  }

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkStructure(process.cwd());
  for (const problem of problems)
    console.log(`${styleText("red", "✗")} ${problem}`);
  if (problems.length) {
    console.log("Rules: docs/baseline/architecture.md");
    process.exitCode = 1;
  }
}
