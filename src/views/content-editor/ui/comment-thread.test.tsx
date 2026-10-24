import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import { addComment } from "../api/comments";
import { CommentThread, type CommentView } from "./comment-thread";

vi.mock("../api/comments", () => ({
  addComment: vi.fn(async () => ({})),
  deleteComment: vi.fn(),
}));

const contentId = "8f6c1c1e-0000-4000-8000-000000000000";

const comment = (overrides: Partial<CommentView>): CommentView => ({
  id: "c1",
  body: "Draft is in the folder.",
  authorName: "Linh Tran",
  createdAt: "2026-10-23T09:20:00.000Z",
  time: "23 Oct, 16:20",
  canDelete: false,
  ...overrides,
});

test("shows each comment with its author and time", () => {
  renderWithIntl(
    <CommentThread
      contentId={contentId}
      comments={[
        comment({}),
        comment({ id: "c2", authorName: null, body: "Old note" }),
      ]}
    />,
  );
  expect(screen.getByText("2 comments")).toBeInTheDocument();
  expect(screen.getByText("Linh Tran")).toBeInTheDocument();
  expect(screen.getByText("Draft is in the folder.")).toBeInTheDocument();
  expect(screen.getByText("Removed member")).toBeInTheDocument();
  expect(screen.getAllByText("23 Oct, 16:20")[0]).toHaveAttribute(
    "datetime",
    "2026-10-23T09:20:00.000Z",
  );
});

test("offers delete only on comments the viewer may remove", () => {
  renderWithIntl(
    <CommentThread
      contentId={contentId}
      comments={[
        comment({ canDelete: true }),
        comment({ id: "c2", authorName: "Minh" }),
      ]}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Delete comment by Linh Tran" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete comment by Minh" }),
  ).not.toBeInTheDocument();
});

test("shows an empty state and sends a new comment", async () => {
  renderWithIntl(<CommentThread contentId={contentId} comments={[]} />);
  expect(screen.getByText(/No comments yet/)).toBeInTheDocument();

  const send = screen.getByRole("button", { name: "Send" });
  expect(send).toBeDisabled();

  const box = screen.getByRole("textbox", { name: "Write a comment" });
  fireEvent.change(box, { target: { value: "Can we post at 20:00?" } });
  fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });

  expect(addComment).toHaveBeenCalledWith(contentId, "Can we post at 20:00?");
  await vi.waitFor(() => expect(box).toHaveValue(""));
});
