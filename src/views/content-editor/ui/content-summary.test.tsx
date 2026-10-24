import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Content } from "@/shared/db/schema";
import { renderWithIntl } from "@/shared/i18n/testing";
import { ContentSummary } from "./content-summary";

const item: Content = {
  id: "8f6c1c1e-0000-4000-8000-000000000001",
  goal: "Promote the new SQL track",
  idea: "Short video: one-minute JOIN explained",
  platforms: ["tiktok"],
  type: "short_video",
  publishDate: null,
  goldenTime: null,
  assigneeId: null,
  status: "planned",
  assetLinks: [],
  script: "",
  scriptUpdatedAt: null,
  createdById: null,
  proposedByKeyId: "key-1",
  proposedByName: "Claude planner",
  proposalReason: "Short explainers got the most saves.",
  rejectedAt: null,
  rejectionReason: null,
  withdrawnAt: null,
  withdrawReason: null,
  sources: [],
  revision: 0,
  reviewedById: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("says an agent proposed an approved idea and who approved it", () => {
  renderWithIntl(
    <ContentSummary
      item={item}
      schedule={null}
      assigneeName={null}
      origin={{ agent: "Claude planner", approvedBy: "Linh" }}
    />,
  );
  expect(
    screen.getByText("Claude planner proposed it, Linh approved it"),
  ).toBeInTheDocument();
});

test("names only the agent when the approver is no longer a member", () => {
  renderWithIntl(
    <ContentSummary
      item={item}
      schedule={null}
      assigneeName={null}
      origin={{ agent: "Claude planner", approvedBy: null }}
    />,
  );
  expect(screen.getByText("Claude planner proposed it")).toBeInTheDocument();
});
