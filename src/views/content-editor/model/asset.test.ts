import { expect, test } from "vitest";
import { createAssetSchema, createVersionSchema } from "./asset";

const assetSchema = createAssetSchema((key) => key);
const versionSchema = createVersionSchema((key) => key);

test("an asset for every platform has no platform", () => {
  expect(
    assetSchema.parse({
      label: " Thumbnail ",
      platform: "",
      url: " https://drive.example/a ",
      note: "",
    }),
  ).toEqual({
    label: "Thumbnail",
    platform: null,
    url: "https://drive.example/a",
    note: "",
  });
});

test("needs a label and an http(s) link", () => {
  const result = assetSchema.safeParse({
    label: "",
    platform: "facebook",
    url: "drive.example/a",
    note: "",
  });
  expect(result.error?.issues.map((issue) => issue.message)).toEqual([
    "assetLinkInvalid",
    "assetLabelRequired",
  ]);
});

test("refuses a platform that doesn't exist", () => {
  expect(
    assetSchema.safeParse({
      label: "Video",
      platform: "myspace",
      url: "https://drive.example/a",
      note: "",
    }).error?.issues[0].message,
  ).toBe("assetPlatformGone");
});

test("a version can't link to a file on someone's computer", () => {
  expect(
    versionSchema.safeParse({ url: "file:///Users/jay/v2.mp4", note: "" })
      .success,
  ).toBe(false);
});
