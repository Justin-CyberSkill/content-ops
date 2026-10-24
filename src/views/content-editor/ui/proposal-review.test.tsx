import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { approveProposal } from "../api/review-proposal";
import { emptyContentForm } from "../model/content-form";
import { ProposalReview } from "./proposal-review";

vi.mock("../api/review-proposal", () => ({
  approveProposal: vi.fn(async () => ({})),
  rejectProposal: vi.fn(async () => ({})),
}));
vi.mock("../api/save-content", () => ({ saveContent: vi.fn() }));

const id = "8f6c1c1e-0000-4000-8000-000000000000";

const renderReview = () =>
  renderWithIntl(
    <ProposalReview
      id={id}
      from="review"
      initial={emptyContentForm}
      members={[]}
      summary={<p>Summary</p>}
      comments={<p>Comments</p>}
    />,
  );

test("starts with the summary and three choices, without the form", () => {
  renderReview();
  expect(screen.getByText("Summary")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Approve and add to plan/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Edit, then approve/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Reject/ })).toBeInTheDocument();
  expect(screen.queryByLabelText("Goal")).not.toBeInTheDocument();
});

test("approves in one step", () => {
  renderReview();
  fireEvent.click(
    screen.getByRole("button", { name: /Approve and add to plan/ }),
  );
  expect(approveProposal).toHaveBeenCalledWith(id);
});

test("opens the form to edit first, and goes back on cancel", () => {
  renderReview();
  fireEvent.click(screen.getByRole("button", { name: /Edit, then approve/ }));
  expect(screen.getByLabelText("Goal")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Save and approve" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByLabelText("Goal")).not.toBeInTheDocument();
});

test("asks for a reason before rejecting", () => {
  renderReview();
  fireEvent.click(screen.getByRole("button", { name: /^Reject/ }));
  expect(screen.getByLabelText("Reason")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reject proposal" }),
  ).toBeInTheDocument();
});
