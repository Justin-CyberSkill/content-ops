import { expect, test } from "vitest";
import { liveCount, publishProgress } from "./live-links";

const fb = { platform: "facebook" as const, liveUrl: "https://fb.com/p/1" };
const ig = { platform: "instagram" as const, liveUrl: "https://ig.com/p/1" };
const platforms = ["facebook", "instagram"] as const;

test("counts only the idea's platforms that have a link", () => {
  expect(
    liveCount(
      [...platforms],
      [fb, { platform: "x", liveUrl: "https://x.com/1" }],
    ),
  ).toBe(1);
  expect(
    liveCount([...platforms], [{ platform: "facebook", liveUrl: null }]),
  ).toBe(0);
});

test("the first link starts publishing, and the last one finishes it", () => {
  expect(publishProgress("todo", [...platforms], [fb])).toBe("in_progress");
  expect(publishProgress("in_progress", [...platforms], [fb, ig])).toBe("done");
  expect(publishProgress("todo", [...platforms], [fb, ig])).toBe("done");
});

test("clearing a link doesn't reopen finished publishing", () => {
  expect(publishProgress("done", [...platforms], [fb])).toBe("done");
  expect(publishProgress("in_progress", [...platforms], [])).toBe(
    "in_progress",
  );
});
