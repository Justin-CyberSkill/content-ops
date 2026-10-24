import { fireEvent, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { ContentRow } from "../api/list-content";
import { ContentTable } from "./content-table";

// Friday: this week runs to Sun 25 Oct.
const today = "2026-10-23";

const row: ContentRow = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  idea: "60s reel: 3 security myths",
  goal: "Grow sign-ups",
  platforms: ["tiktok", "instagram"],
  type: "short_video",
  publishDate: "2026-10-24",
  goldenTime: "19:30:00",
  status: "in_progress",
  assetLinks: ["https://drive.example/a", "https://drive.example/b"],
  assigneeName: null,
  progress: null,
};

test("shows each item with its day, labels and edit link", () => {
  renderWithIntl(
    <ContentTable
      rows={[{ ...row, publishDate: "2026-10-25" }]}
      today={today}
    />,
  );
  expect(screen.getByText("Sun 25 Oct")).toBeInTheDocument();
  expect(screen.getByText("19:30")).toBeInTheDocument();
  expect(screen.getByText("TikTok · Instagram")).toBeInTheDocument();
  expect(screen.getByText("Short video")).toBeInTheDocument();
  expect(screen.getByText("Unassigned")).toBeInTheDocument();
  expect(screen.getByText("In progress")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "60s reel: 3 security myths" }),
  ).toHaveAttribute("href", `/en/content/${row.id}`);
});

test("groups items by week and tucks published ones away", () => {
  renderWithIntl(
    <ContentTable
      rows={[
        row,
        { ...row, id: "b", idea: "Late post", publishDate: "2026-10-20" },
        {
          ...row,
          id: "c",
          idea: "Done post",
          publishDate: "2026-10-20",
          status: "published",
        },
        { ...row, id: "d", idea: "Someday", publishDate: null },
      ]}
      today={today}
    />,
  );
  const headings = screen
    .getAllByRole("heading", { level: 2 })
    .map((h) => h.textContent);
  expect(headings).toEqual([
    "Overdue1",
    expect.stringMatching(/^This week1 ?19\s*–\s*25 Oct$/),
    "No date1",
    "Published1",
  ]);
  expect(screen.getByText("Done post")).not.toBeVisible();
});

test("opens the reference links from one button", async () => {
  renderWithIntl(<ContentTable rows={[row]} today={today} />);
  fireEvent.click(screen.getByRole("button", { name: "2 reference links" }));
  const menu = await screen.findByRole("menu");
  expect(
    within(menu).getByRole("menuitem", { name: "drive.example/a" }),
  ).toHaveAttribute("href", "https://drive.example/a");
});

test("shows the year only for another year", () => {
  renderWithIntl(
    <ContentTable
      rows={[{ ...row, publishDate: "2027-01-05" }]}
      today={today}
    />,
  );
  expect(screen.getByText("Tue, 5 Jan 2027")).toBeInTheDocument();
});

test("shows an empty state", () => {
  renderWithIntl(<ContentTable rows={[]} today={today} />);
  expect(screen.getByText(/Nothing planned yet/)).toBeInTheDocument();
});

test("says today and tomorrow instead of the date", () => {
  renderWithIntl(
    <ContentTable
      rows={[
        { ...row, id: "a", publishDate: today },
        { ...row, id: "b", publishDate: "2026-10-24" },
      ]}
      today={today}
    />,
  );
  expect(screen.getByText("Today")).toBeInTheDocument();
  expect(screen.getByText("Tomorrow")).toBeInTheDocument();
});

test("shows the task in hand and flags it once it's overdue", () => {
  renderWithIntl(
    <ContentTable
      rows={[
        {
          ...row,
          progress: {
            step: 2,
            total: 4,
            open: { name: "Asset prep", dueDate: "2026-10-22" },
          },
        },
      ]}
      today={today}
    />,
  );
  // Once for phones and once for wider screens; CSS shows one of them.
  expect(screen.getAllByText("Step 2 of 4: Asset prep")).toHaveLength(2);
  expect(screen.getAllByText("Overdue: Thu 22 Oct")).toHaveLength(2);
});
