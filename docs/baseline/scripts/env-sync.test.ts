import { describe, expect, test } from "vitest";
import { PLACEHOLDER, parse, sync } from "./env-sync";

const example = `# Database
DATABASE_URL=postgres://localhost/app

# Auth
SECRET=
URL=http://localhost:3000
`;

describe("sync", () => {
  test("reorders keys and copies comments from the example", () => {
    const result = sync(example, "URL=u\nSECRET=s\nDATABASE_URL=d\n");
    expect(result.text).toBe(
      "# Database\nDATABASE_URL=d\n\n# Auth\nSECRET=s\nURL=u\n",
    );
    expect(result.reordered).toBe(true);
    expect(result.changed).toBe(true);
  });

  test("adds missing keys as placeholders", () => {
    const result = sync(example, "DATABASE_URL=d\nURL=u\n");
    expect(result.text).toContain(`SECRET=${PLACEHOLDER}`);
    expect(result.added).toEqual(["SECRET"]);
    expect(result.placeholders).toEqual(["SECRET"]);
  });

  test("keeps keys missing from the example at the end", () => {
    const result = sync(example, "EXTRA=x\nDATABASE_URL=d\nSECRET=s\nURL=u\n");
    expect(result.text.endsWith("# Not in .env.example\nEXTRA=x\n")).toBe(true);
    expect(result.extra).toEqual(["EXTRA"]);
  });

  test("keeps the last value of a duplicated key", () => {
    const result = sync(
      example,
      "DATABASE_URL=a\nDATABASE_URL=b\nSECRET=s\nURL=u\n",
    );
    expect(result.text).toContain("DATABASE_URL=b");
    expect(result.text).not.toContain("DATABASE_URL=a");
    expect(result.duplicates).toEqual(["DATABASE_URL"]);
  });

  test("leaves an aligned file unchanged", () => {
    const aligned = "# Database\nDATABASE_URL=d\n\n# Auth\nSECRET=s\nURL=u\n";
    const result = sync(example, aligned);
    expect(result.changed).toBe(false);
    expect(result.reordered).toBe(false);
  });

  test("keeps inline comments, export prefixes and multi-line values", () => {
    const key = 'SECRET="-----BEGIN KEY-----\nabc\n-----END KEY-----"';
    const result = sync(
      example,
      `export URL=u # local\n${key}\nDATABASE_URL=d\n`,
    );
    expect(result.text).toContain("export URL=u # local");
    expect(result.text).toContain(key);
    expect(result.changed).toBe(true);
  });

  test("rejects an example with duplicate keys", () => {
    expect(() => sync("A=1\nA=2\n", "A=1\n")).toThrow("duplicate keys: A");
  });
});

test("parse keeps a multi-line quoted value as one entry", () => {
  const lines = parse('A="x\ny"\nB=1\n');
  expect(lines).toEqual([
    { kind: "entry", key: "A", text: 'A="x\ny"' },
    { kind: "entry", key: "B", text: "B=1" },
  ]);
});
