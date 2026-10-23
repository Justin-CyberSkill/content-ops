import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { ContentRow } from "../api/list-content";
import { ContentTable } from "./content-table";

const row: ContentRow = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  idea: "60s reel: 3 security myths",
  goal: "Grow sign-ups",
  platforms: ["tiktok", "instagram"],
  type: "short_video",
  publishDate: "2026-10-27",
  goldenTime: "19:30:00",
  status: "in_progress",
  assetLinks: ["https://drive.example/a"],
  assigneeName: null,
};

test("shows each item with its schedule, labels and edit link", () => {
  renderWithIntl(<ContentTable rows={[row]} />);
  expect(screen.getByText("Tue, 27 Oct 2026 · 19:30")).toBeInTheDocument();
  expect(screen.getByText("TikTok")).toBeInTheDocument();
  expect(screen.getByText("Instagram")).toBeInTheDocument();
  expect(screen.getByText("Short video")).toBeInTheDocument();
  expect(screen.getByText("Unassigned")).toBeInTheDocument();
  expect(screen.getByText("In progress")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "60s reel: 3 security myths" }),
  ).toHaveAttribute("href", `/content/${row.id}`);
  expect(screen.getByRole("link", { name: "drive.example" })).toHaveAttribute(
    "href",
    "https://drive.example/a",
  );
});

test("shows an empty state", () => {
  renderWithIntl(<ContentTable rows={[]} />);
  expect(screen.getByText(/Nothing planned yet/)).toBeInTheDocument();
});
