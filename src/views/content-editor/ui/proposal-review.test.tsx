import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { WorkPlan } from "@/entities/task/index.server";
import { CONTENT_TYPES } from "@/shared/db/schema";
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
const prepStep = "8f6c1c1e-0000-4000-8000-0000000000a1";
const assetStep = "8f6c1c1e-0000-4000-8000-0000000000a2";
const ky = { id: "user-ky", name: "TuyetKy" };
const jay = { id: "user-jay", name: "Jay" };

const plan = Object.fromEntries(
  CONTENT_TYPES.map((type) => [type, []]),
) as unknown as WorkPlan;
plan.short_video = [
  {
    id: prepStep,
    name: "Content prep",
    daysBefore: 5,
    candidates: [{ ...ky, load: 1 }],
    suggestedId: ky.id,
  },
  {
    id: assetStep,
    name: "Asset prep",
    daysBefore: 3,
    candidates: [{ ...jay, load: 0 }],
    suggestedId: jay.id,
  },
];

const renderReview = () =>
  renderWithIntl(
    <ProposalReview
      id={id}
      revision={3}
      from="review"
      initial={{
        ...emptyContentForm,
        type: "short_video",
        publishDate: "2026-11-06",
      }}
      members={[ky, jay]}
      plan={plan}
      today="2026-10-24"
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

test("suggests who does each step, with its due day", () => {
  renderReview();
  expect(screen.getByLabelText("Content prep")).toHaveValue(ky.id);
  expect(screen.getByLabelText("Asset prep")).toHaveValue(jay.id);
  expect(screen.getByText("Due Sun 1 Nov")).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "TuyetKy · 1 open task" }),
  ).toBeInTheDocument();
});

test("approves in one step, the version and people on screen", () => {
  renderReview();
  fireEvent.change(screen.getByLabelText("Asset prep"), {
    target: { value: ky.id },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /Approve and add to plan/ }),
  );
  expect(approveProposal).toHaveBeenCalledWith(id, 3, {
    [prepStep]: ky.id,
    [assetStep]: ky.id,
  });
});

test("opens the form to edit first, and goes back on cancel", () => {
  renderReview();
  fireEvent.click(screen.getByRole("button", { name: /Edit, then approve/ }));
  expect(screen.getByLabelText("Goal")).toBeInTheDocument();
  expect(
    document.querySelector<HTMLInputElement>('input[name="revision"]')?.value,
  ).toBe("3");
  expect(
    screen.getByRole("button", { name: "Save and approve" }),
  ).toBeInTheDocument();
  // Who does what moves into the form, instead of a status and one owner.
  expect(screen.getByLabelText("Content prep")).toHaveAttribute(
    "name",
    `assignee:${prepStep}`,
  );
  expect(screen.queryByLabelText("Assignee")).not.toBeInTheDocument();
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
