import { expect, test } from "vitest";
import { matchesName } from "./match-name";

test("matches any part of a name, ignoring case and accents", () => {
  expect(matchesName("Nguyễn Thuỳ Linh", "linh")).toBe(true);
  expect(matchesName("Nguyễn Thuỳ Linh", "thuy")).toBe(true);
  expect(matchesName("Trần Đức Minh", "duc")).toBe(true);
  expect(matchesName("Trần Đức Minh", "linh")).toBe(false);
});

test("an empty search matches everyone", () => {
  expect(matchesName("Phạm Bảo An", "  ")).toBe(true);
});
