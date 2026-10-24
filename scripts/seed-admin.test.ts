import { describe, expect, test } from "vitest";
import { readSeedConfig, temporaryPassword } from "./seed-admin";

const DATABASE_URL = "postgres://postgres:postgres@localhost:5432/test";

describe("readSeedConfig", () => {
  test("normalizes the email and derives a name from it", () => {
    expect(
      readSeedConfig({ DATABASE_URL, ADMIN_EMAIL: " Justin@Example.com " }),
    ).toEqual({
      databaseUrl: DATABASE_URL,
      email: "justin@example.com",
      name: "justin",
    });
  });

  test("uses ADMIN_NAME when set", () => {
    expect(
      readSeedConfig({
        DATABASE_URL,
        ADMIN_EMAIL: "a@example.com",
        ADMIN_NAME: "Justin",
      }).name,
    ).toBe("Justin");
  });

  test("rejects a missing email", () => {
    expect(() => readSeedConfig({ DATABASE_URL, ADMIN_EMAIL: "" })).toThrow(
      /ADMIN_EMAIL/,
    );
  });
});

test("temporaryPassword is 16 alphanumeric characters", () => {
  expect(temporaryPassword()).toMatch(/^[a-zA-Z0-9]{16}$/);
});
