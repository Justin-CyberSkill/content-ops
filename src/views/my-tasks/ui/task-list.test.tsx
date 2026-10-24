import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { Task } from "../api/list-my-tasks";
import { TaskList } from "./task-list";

vi.mock("../api/update-status", () => ({ updateTaskStatus: vi.fn() }));

const task: Task = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  idea: "60s reel: 3 security myths",
  goal: "Grow sign-ups",
  platforms: ["tiktok"],
  type: "short_video",
  publishDate: "2026-10-27",
  goldenTime: "19:30:00",
  status: "in_review",
  assetLinks: ["https://drive.example/a"],
};

test("shows each task with its schedule and current status", () => {
  renderWithIntl(<TaskList tasks={[task]} />);
  expect(screen.getByText("Tue, 27 Oct 2026 · 19:30")).toBeInTheDocument();
  expect(screen.getByText("Short video")).toBeInTheDocument();
  expect(screen.getByText("TikTok")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "60s reel: 3 security myths" }),
  ).toHaveAttribute("href", `/en/my-tasks/${task.id}`);
  expect(
    screen.getByRole("combobox", {
      name: "Status of 60s reel: 3 security myths",
    }),
  ).toHaveValue("in_review");
});

test("shows an empty state", () => {
  renderWithIntl(<TaskList tasks={[]} />);
  expect(screen.getByText("Nothing assigned to you")).toBeInTheDocument();
});

test("lists open tasks first and published ones apart", () => {
  renderWithIntl(
    <TaskList
      tasks={[
        task,
        {
          ...task,
          id: "8f6c1c1e-0000-4000-8000-000000000001",
          idea: "Old carousel",
          status: "published",
        },
      ]}
    />,
  );
  const [toDo, published] = screen.getAllByRole("heading", { level: 2 });
  expect(toDo).toHaveTextContent("To do");
  expect(published).toHaveTextContent("Published");
});
