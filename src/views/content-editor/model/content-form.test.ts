import { describe, expect, test } from "vitest";
import {
  contentFormSchema,
  readContentForm,
  toFormValues,
} from "./content-form";

function formData(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const valid: [string, string][] = [
  ["goal", " Grow sign-ups for the course "],
  ["idea", "60s reel: 3 security myths"],
  ["platforms", "tiktok"],
  ["platforms", "instagram"],
  ["type", "short_video"],
  ["publishDate", "2026-10-27"],
  ["goldenTime", "19:30"],
  ["assigneeId", ""],
  ["status", "planned"],
  ["assetLinks", "https://drive.example/a\n\n  https://figma.example/b  \n"],
];

describe("contentFormSchema", () => {
  test("parses a full form", () => {
    expect(contentFormSchema.parse(readContentForm(formData(valid)))).toEqual({
      goal: "Grow sign-ups for the course",
      idea: "60s reel: 3 security myths",
      platforms: ["tiktok", "instagram"],
      type: "short_video",
      publishDate: "2026-10-27",
      goldenTime: "19:30",
      assigneeId: null,
      status: "planned",
      assetLinks: ["https://drive.example/a", "https://figma.example/b"],
    });
  });

  test("allows no date, time or links", () => {
    const result = contentFormSchema.parse(
      readContentForm(
        formData(
          valid.map(([key, value]) =>
            ["publishDate", "goldenTime", "assetLinks"].includes(key)
              ? [key, ""]
              : [key, value],
          ),
        ),
      ),
    );
    expect(result).toMatchObject({
      publishDate: null,
      goldenTime: null,
      assetLinks: [],
    });
  });

  test.each([
    ["platforms", "Pick at least one platform."],
    ["goal", "Write the goal: what we want and why."],
  ])("requires %s", (field, message) => {
    const result = contentFormSchema.safeParse(
      readContentForm(formData(valid.filter(([key]) => key !== field))),
    );
    expect(result.error?.issues[0].message).toBe(message);
  });

  test("rejects links that are not http(s)", () => {
    const result = contentFormSchema.safeParse(
      readContentForm(
        formData([
          ...valid.filter(([key]) => key !== "assetLinks"),
          ["assetLinks", "javascript:alert(1)"],
        ]),
      ),
    );
    expect(result.success).toBe(false);
  });
});

test("toFormValues trims seconds from the golden time", () => {
  expect(
    toFormValues({
      id: "1",
      goal: "g",
      idea: "i",
      platforms: ["x"],
      type: "quiz",
      publishDate: null,
      goldenTime: "08:15:00",
      assigneeId: null,
      status: "planned",
      assetLinks: ["https://a.example", "https://b.example"],
      createdById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ).toMatchObject({
    goldenTime: "08:15",
    publishDate: "",
    assetLinks: "https://a.example\nhttps://b.example",
  });
});
