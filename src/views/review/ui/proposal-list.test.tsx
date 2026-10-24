import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { Proposal } from "../api/list-proposals";
import { ProposalList } from "./proposal-list";

const proposal: Proposal = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  idea: "Carousel: 5 phishing signs",
  goal: "Grow course sign-ups",
  platforms: ["instagram"],
  type: "carousel",
  publishDate: "2026-10-30",
  goldenTime: "20:00:00",
  proposedByName: "Claude planner",
  proposalReason: "Phishing posts got 2x saves last month.",
  createdAt: new Date("2026-10-23T09:00:00Z"),
  updatedAt: new Date("2026-10-23T09:00:00Z"),
  revision: 0,
};

test("shows who proposed it, its format and date, why, and a link to decide", () => {
  renderWithIntl(
    <ProposalList proposals={[proposal]} timeZone="Asia/Ho_Chi_Minh" />,
  );
  expect(screen.getByText("Claude planner")).toBeInTheDocument();
  expect(
    screen.getByText("Phishing posts got 2x saves last month."),
  ).toBeInTheDocument();
  expect(screen.getByText("Fri, 30 Oct 2026 · 20:00")).toBeInTheDocument();
  expect(screen.getByText("Carousel · Instagram")).toBeInTheDocument();
  expect(screen.getByText("proposed 23 Oct, 16:00")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Carousel: 5 phishing signs" }),
  ).toHaveAttribute("href", `/en/review/${proposal.id}`);
});

test("says when an agent changed it after proposing", () => {
  renderWithIntl(
    <ProposalList
      proposals={[
        {
          ...proposal,
          revision: 2,
          updatedAt: new Date("2026-10-23T10:30:00Z"),
        },
      ]}
      timeZone="Asia/Ho_Chi_Minh"
    />,
  );
  expect(
    screen.getByText("proposed 23 Oct, 16:00 · changed 23 Oct, 17:30"),
  ).toBeInTheDocument();
});

test("shows an empty state", () => {
  renderWithIntl(<ProposalList proposals={[]} timeZone="Asia/Ho_Chi_Minh" />);
  expect(screen.getByText("No proposals right now")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Manage agents" })).toHaveAttribute(
    "href",
    "/en/agents",
  );
});
