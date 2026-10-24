import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { Markdown, MarkdownPreview } from "./markdown";

// The shape agents already send: labelled lines, a numbered list, bare links.
const brief = [
  "Mục tiêu: giúp người học hiểu kỳ thi.",
  "",
  "Nội dung chính:",
  "1. Thi ở đâu",
  "2. Chi phí",
  "",
  "CTA: Làm thử câu hỏi mẫu.",
  "Link: https://practice.cyberskill.world/vi/practice?utm_source=facebook",
].join("\n");

test("keeps line breaks, lists and links as written", () => {
  const { container } = renderWithIntl(<Markdown>{brief}</Markdown>);
  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual(["Thi ở đâu", "Chi phí"]);
  // "CTA" and "Link" stay on their own lines.
  expect(container.querySelectorAll("br")).toHaveLength(1);
  const link = screen.getByRole("link", {
    name: "https://practice.cyberskill.world/vi/practice?utm_source=facebook",
  });
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});

test("shows raw HTML as text and runs none of it", () => {
  const { container } = renderWithIntl(
    <Markdown>
      {'<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">'}
    </Markdown>,
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
  expect(container).toHaveTextContent("<script>alert(1)</script>");
});

test("drops unsafe links and keeps their words", () => {
  renderWithIntl(<Markdown>{"[Open](javascript:alert(1))"}</Markdown>);
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("Open")).toBeInTheDocument();
});

test("shows an image as a link to it instead of loading it", () => {
  const { container } = renderWithIntl(
    <Markdown>{"![Umbra pose](https://example.com/umbra.png)"}</Markdown>,
  );
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByRole("link", { name: "Umbra pose" })).toHaveAttribute(
    "href",
    "https://example.com/umbra.png",
  );
});

test("fits headings under the headings around it", () => {
  renderWithIntl(
    <Markdown headingLevel={3}>{"# Brief\n\n## Scenes\n\ntext"}</Markdown>,
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Brief" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 4, name: "Scenes" }),
  ).toBeInTheDocument();
});

test("a preview is one run of words, with no links or lists", () => {
  const { container } = render(
    <p>
      <MarkdownPreview>
        {
          "## Brief\n**Goal:** grow sign-ups\n\n- one\n- [two](https://example.com)"
        }
      </MarkdownPreview>
    </p>,
  );
  expect(container.textContent?.replace(/\s+/g, " ").trim()).toBe(
    "Brief Goal: grow sign-ups one two",
  );
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText("Goal:").tagName).toBe("STRONG");
  expect(screen.getByText("Brief").tagName).toBe("STRONG");
});
