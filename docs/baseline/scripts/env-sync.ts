/**
 * Keep every local .env file aligned with .env.example.
 *
 *   pnpm env:sync               align every .env* file in the project root
 *   pnpm env:sync .env.local    align one file (created from .env.example if missing)
 *   pnpm env:sync --check       report only; exit 1 if any file is out of sync
 *
 * .env.example is the source of truth for key order, comments and sections.
 * Values are never printed.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";

export const PLACEHOLDER = "PLACEHOLDER";
const EXAMPLE = ".env.example";
const EXTRA_HEADER = `# Not in ${EXAMPLE}`;

type Line =
  | { kind: "entry"; key: string; text: string }
  | { kind: "other"; text: string };

export type SyncResult = {
  text: string;
  changed: boolean;
  reordered: boolean;
  added: string[];
  extra: string[];
  duplicates: string[];
  placeholders: string[];
};

const ENTRY = /^\s*(?:export\s+)?([A-Za-z_][\w.-]*)\s*=(.*)$/;

/** Splits a dotenv file into entries (multi-line quoted values kept whole) and other lines. */
export function parse(content: string): Line[] {
  const rows = content.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const lines: Line[] = [];
  for (let i = 0; i < rows.length; i++) {
    const match = ENTRY.exec(rows[i]);
    if (!match) {
      lines.push({ kind: "other", text: rows[i] });
      continue;
    }
    let text = rows[i];
    const value = match[2].trimStart();
    const quote = value[0];
    const opensMultiline = /^["'`]/.test(value) && !value.includes(quote, 1);
    while (opensMultiline && i + 1 < rows.length) {
      text += `\n${rows[++i]}`;
      if (rows[i].includes(quote)) break;
    }
    lines.push({ kind: "entry", key: match[1], text });
  }
  return lines;
}

function readValue(text: string): string {
  const raw = text.slice(text.indexOf("=") + 1).trim();
  const quote = raw[0];
  if (quote === '"' || quote === "'" || quote === "`") {
    return raw.slice(1, raw.lastIndexOf(quote));
  }
  return raw.replace(/\s+#.*$/, "");
}

/** Rebuilds `target` in the layout of `example`, keeping the target's values. */
export function sync(example: string, target: string): SyncResult {
  const layout = parse(example);
  const exampleKeys = layout.flatMap((l) =>
    l.kind === "entry" ? [l.key] : [],
  );
  const dupesInExample = exampleKeys.filter(
    (k, i) => exampleKeys.indexOf(k) !== i,
  );
  if (dupesInExample.length) {
    throw new Error(
      `${EXAMPLE} has duplicate keys: ${dupesInExample.join(", ")}`,
    );
  }

  const values = new Map<string, string>();
  const duplicates: string[] = [];
  for (const line of parse(target)) {
    if (line.kind !== "entry") continue;
    if (values.has(line.key)) duplicates.push(line.key);
    values.delete(line.key); // last value wins, at its last position
    values.set(line.key, line.text);
  }

  const out: string[] = [];
  const added: string[] = [];
  for (const line of layout) {
    if (line.kind === "other") out.push(line.text);
    else if (values.has(line.key)) out.push(values.get(line.key) as string);
    else {
      out.push(`${line.key}=${PLACEHOLDER}`);
      added.push(line.key);
    }
  }

  const known = new Set(exampleKeys);
  const extra = [...values.keys()].filter((k) => !known.has(k));
  if (extra.length) {
    out.push("", EXTRA_HEADER, ...extra.map((k) => values.get(k) as string));
  }

  const text = `${out.join("\n")}\n`;
  const order = [...values.keys()].filter((k) => known.has(k));
  const expected = exampleKeys.filter((k) => values.has(k));
  const placeholders = parse(text).flatMap((l) =>
    l.kind === "entry" && readValue(l.text) === PLACEHOLDER ? [l.key] : [],
  );

  return {
    text,
    changed: text !== target.replace(/\r\n/g, "\n"),
    reordered: order.join() !== expected.join(),
    added,
    extra,
    duplicates: [...new Set(duplicates)],
    placeholders,
  };
}

function main(args: string[]) {
  const check = args.includes("--check");
  const root = process.cwd();
  const examplePath = resolve(root, EXAMPLE);
  if (!existsSync(examplePath)) {
    console.error(styleText("red", `${EXAMPLE} not found in ${root}`));
    return 1;
  }
  const example = readFileSync(examplePath, "utf8");

  const named = args.filter((a) => !a.startsWith("--"));
  const files = named.length
    ? named
    : readdirSync(root)
        .filter((f) => /^\.env(\..+)?$/.test(f) && f !== EXAMPLE)
        .sort();
  if (!files.length) {
    console.log(
      `No .env files found. Create one with: pnpm env:sync .env.local`,
    );
    return 0;
  }

  let outOfSync = false;
  for (const file of files) {
    const path = resolve(root, file);
    if (!existsSync(path)) {
      if (check) {
        console.log(`${styleText("yellow", "!")} ${file}: missing`);
        outOfSync = true;
      } else {
        writeFileSync(path, example, { mode: 0o600 });
        console.log(
          `${styleText("green", "+")} ${file}: created from ${EXAMPLE}`,
        );
      }
      continue;
    }

    const result = sync(example, readFileSync(path, "utf8"));
    const notes = [
      ...result.added.map(
        (k) =>
          `${styleText("yellow", "+")} ${k}: missing, set to ${PLACEHOLDER}`,
      ),
      ...result.extra.map(
        (k) =>
          `${styleText("yellow", "!")} ${k}: not in ${EXAMPLE}, moved to the end`,
      ),
      ...result.duplicates.map(
        (k) =>
          `${styleText("yellow", "!")} ${k}: defined more than once, kept the last value`,
      ),
      ...result.placeholders
        .filter((k) => !result.added.includes(k))
        .map((k) => `${styleText("yellow", "!")} ${k}: still ${PLACEHOLDER}`),
    ];
    if (result.reordered)
      notes.unshift(`${styleText("cyan", "~")} keys reordered`);

    if (result.changed || result.placeholders.length) outOfSync = true;
    if (result.changed && !check) writeFileSync(path, result.text);

    const status = !result.changed
      ? styleText("green", "in sync")
      : check
        ? styleText("yellow", "out of sync")
        : styleText("green", "updated");
    console.log(`${file}: ${status}`);
    for (const note of notes) console.log(`  ${note}`);
  }

  return check && outOfSync ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
