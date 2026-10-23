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
};

test("shows who proposed it, why, and a link to review it", () => {
  renderWithIntl(<ProposalList proposals={[proposal]} />);
  expect(screen.getByText("Claude planner")).toBeInTheDocument();
  expect(
    screen.getByText("Phishing posts got 2x saves last month."),
  ).toBeInTheDocument();
  expect(screen.getByText("Fri, 30 Oct 2026 · 20:00")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Review Carousel: 5 phishing signs" }),
  ).toHaveAttribute("href", `/en/content/${proposal.id}`);
});

test("shows an empty state", () => {
  renderWithIntl(<ProposalList proposals={[]} />);
  expect(screen.getByText("Nothing to review")).toBeInTheDocument();
});
