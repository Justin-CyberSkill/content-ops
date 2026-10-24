/**
 * Check that agent docs only point at files that exist, so no agent follows a stale path.
 * Reads AGENTS.md, CLAUDE.md, README.md, docs/ and .claude/skills/, skipping code blocks.
 * - Relative links and `@file` imports must resolve.
 * - File paths in `code` (with an extension) must exist, except in docs/baseline,
 *   where paths are examples. Folders are skipped: docs also name folders not to create.
 *
 *   pnpm lint    runs it after Biome
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";

const ROOT_DOCS = ["AGENTS.md", "CLAUDE.md", "README.md"];
const DOC_DIRS = ["docs", ".claude/skills"];
const EXAMPLES = "docs/baseline/";
const LINK = /\[[^\]]*\]\(([^)\s]+)[^)]*\)/g;
const CODE_SPAN = /`([^`\s]+)`/g;
/** A file in a folder: no placeholders, globs or URLs, and an extension. */
const FILE_PATH = /^[\w.][\w.@()[\]-]*(\/[\w.@()[\]-]+)+\.[a-z0-9]+$/i;
const EXTERNAL = /^([a-z][a-z+.-]*:|#|\/\/)/i;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".md") ? [path] : [];
  });
}

/** The doc's lines outside fenced code blocks, with their line numbers. */
function prose(text: string): [number, string][] {
  const lines: [number, string][] = [];
  let fence = "";
  text.split("\n").forEach((line, i) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (marker && (!fence || marker[0] === fence[0])) {
      fence = fence ? "" : marker;
    } else if (!fence) {
      lines.push([i + 1, line]);
    }
  });
  return lines;
}

/** Problems in one doc. `file` is relative to `root`. */
export function checkDoc(root: string, file: string, text: string): string[] {
  const problems: string[] = [];
  const here = dirname(join(root, file));
  const missing = (line: number, target: string, path: string) => {
    if (!existsSync(path))
      problems.push(`${file}:${line}: ${target} not found`);
  };

  for (const [line, content] of prose(text)) {
    for (const [, target] of content.matchAll(LINK)) {
      if (EXTERNAL.test(target) || target.startsWith("<")) continue;
      const path = decodeURI(target.replace(/[#?].*$/, ""));
      if (path) {
        missing(
          line,
          target,
          path.startsWith("/") ? join(root, path) : join(here, path),
        );
      }
    }

    const imported = /^@(\S+)$/.exec(content.trim())?.[1];
    if (imported) missing(line, `@${imported}`, join(here, imported));

    if (file.startsWith(EXAMPLES)) continue;
    for (const [, span] of content.matchAll(CODE_SPAN)) {
      const path = span.replace(/:\d+(:\d+)?$/, "");
      const top = path.split("/")[0];
      // Only spans that start at a real top-level folder: routes like `api/agent` are not paths.
      if (!FILE_PATH.test(path) || top === "node_modules") continue;
      if (!existsSync(join(root, top))) continue;
      missing(line, `\`${span}\``, join(root, path));
    }
  }
  return problems;
}

export function checkDocs(root: string): string[] {
  const files = [
    ...ROOT_DOCS.filter((name) => existsSync(join(root, name))),
    ...DOC_DIRS.flatMap((dir) =>
      walk(join(root, dir)).map((path) => relative(root, path)),
    ),
  ];
  return files.flatMap((file) =>
    checkDoc(root, file, readFileSync(join(root, file), "utf8")),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkDocs(process.cwd());
  for (const problem of problems)
    console.log(`${styleText("red", "✗")} ${problem}`);
  if (problems.length) {
    console.log("Fix the path, or remove the line if the file is gone.");
    process.exitCode = 1;
  }
}
