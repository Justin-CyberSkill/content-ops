import { expect, test } from "vitest";
import { safeNext } from "./safe-next";

test.each([
  ["/content", "/content"],
  ["/content?x=1", "/content?x=1"],
  ["", "/"],
  [null, "/"],
  ["https://evil.example", "/"],
  ["//evil.example", "/"],
  ["/\\evil.example", "/"],
])("safeNext(%j) is %j", (input, expected) => {
  expect(safeNext(input)).toBe(expected);
});
