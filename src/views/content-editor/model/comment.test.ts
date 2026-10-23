import { expect, test } from "vitest";
import { COMMENT_MAX_LENGTH, createCommentSchema } from "./comment";

const schema = createCommentSchema((key) => key);

test("trims the comment", () => {
  expect(schema.parse("  Draft is in the folder.\n")).toBe(
    "Draft is in the folder.",
  );
});

test("rejects an empty or blank comment", () => {
  expect(schema.safeParse(" \n ").error?.issues[0].message).toBe(
    "commentRequired",
  );
});

test("rejects a comment over the limit", () => {
  expect(
    schema.safeParse("a".repeat(COMMENT_MAX_LENGTH + 1)).error?.issues[0]
      .message,
  ).toBe("commentTooLong");
});
