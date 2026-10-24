import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Content } from "@/shared/db/schema";
import { renderWithIntl } from "@/shared/i18n/testing";
import { type HistoryEntry, ProposalCard } from "./proposal-card";

const item: Content = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  goal: "Show the brain games are fun",
  idea: "Short video: memory game challenge",
  platforms: ["tiktok"],
  type: "short_video",
  publishDate: null,
  goldenTime: null,
  assigneeId: null,
  status: "proposed",
  assetLinks: [],
  createdById: null,
  proposedByKeyId: "key-1",
  proposedByName: "Claude planner",
  proposalReason: "Brain games ranked first for Q4.",
  rejectedAt: null,
  rejectionReason: null,
  withdrawnAt: null,
  withdrawReason: null,
  sources: ["https://github.com/org/repo/issues/42", "Roadmap sync 20 Oct"],
  revision: 1,
  reviewedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const entry = (over: Partial<HistoryEntry>): HistoryEntry => ({
  id: crypto.randomUUID(),
  action: "proposed",
  actorName: "Claude planner",
  fields: [],
  time: "24 Oct, 15:18",
  ...over,
});

const renderCard = (overrides: Partial<Content>, history: HistoryEntry[]) =>
  renderWithIntl(
    <ProposalCard
      item={{ ...item, ...overrides }}
      proposedAt="24 Oct, 15:18"
      schedule={null}
      history={history}
    />,
  );

test("lists what the idea is based on, linking the URLs", () => {
  renderCard({}, [entry({})]);
  expect(
    screen.getByRole("link", { name: "https://github.com/org/repo/issues/42" }),
  ).toHaveAttribute("href", "https://github.com/org/repo/issues/42");
  expect(screen.getByText("Roadmap sync 20 Oct")).toBeInTheDocument();
});

test("says which fields an agent changed", () => {
  renderCard({}, [
    entry({}),
    entry({ action: "updated", fields: ["idea", "publishDate"] }),
  ]);
  expect(
    screen.getByText("Claude planner changed the idea and the publish day"),
  ).toBeInTheDocument();
});

test("hides history while it only says who proposed it", () => {
  renderCard({}, [entry({})]);
  expect(screen.queryByText("History")).not.toBeInTheDocument();
});

test("shows who withdrew it and why", () => {
  renderCard(
    { withdrawnAt: new Date(), withdrawReason: "Replaced by a better idea" },
    [entry({}), entry({ action: "withdrawn" })],
  );
  expect(screen.getByText("Withdrawn by Claude planner")).toBeInTheDocument();
  expect(screen.getByText("Replaced by a better idea")).toBeInTheDocument();
});
