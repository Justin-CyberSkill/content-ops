import { expect, test } from "vitest";
import {
  captionField,
  characterCount,
  createCaptionsSchema,
  normalizeHashtags,
  postText,
  readCaptionsForm,
} from "./captions";

const schema = createCaptionsSchema((key) => key);

test("postText puts the hashtags after the caption", () => {
  expect(postText("Hello ", "#a #b")).toBe("Hello\n\n#a #b");
  expect(postText("Hello", "")).toBe("Hello");
  expect(postText("", "#a")).toBe("#a");
});

test("counts an emoji as one character", () => {
  expect(characterCount("hi 👋")).toBe(4);
});

test("normalizeHashtags adds the # and one space between tags", () => {
  expect(normalizeHashtags("cyber, #skill  ##learn\n")).toBe(
    "#cyber #skill #learn",
  );
  expect(normalizeHashtags("  ")).toBe("");
});

test("reads one set of fields per platform", () => {
  const form = new FormData();
  form.set("script", " Scene 1 ");
  form.set(captionField("caption", "facebook"), "Hi");
  form.set(captionField("hashtags", "facebook"), "cyber");
  const parsed = schema.parse(readCaptionsForm(form, ["facebook", "x"]));
  expect(parsed).toEqual({
    script: "Scene 1",
    posts: [
      {
        platform: "facebook",
        caption: "Hi",
        hashtags: "#cyber",
        pinnedComment: "",
      },
      { platform: "x", caption: "", hashtags: "", pinnedComment: "" },
    ],
  });
});

test("refuses a caption that's far too long", () => {
  const result = schema.safeParse({
    script: "",
    posts: [
      {
        platform: "x",
        caption: "a".repeat(10_001),
        hashtags: "",
        pinnedComment: "",
      },
    ],
  });
  expect(result.error?.issues[0].message).toBe("captionTooLong");
});
