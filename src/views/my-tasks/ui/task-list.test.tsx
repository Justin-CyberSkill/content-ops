import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithIntl } from "@/shared/i18n/testing";
import type { MyTask } from "../api/list-my-tasks";
import { TaskList } from "./task-list";

vi.mock("../api/update-status", () => ({ updateItemStatus: vi.fn() }));
vi.mock("@/features/task-progress/api/change-task", () => ({
  changeTaskStatus: vi.fn(),
  changeTaskAssignee: vi.fn(),
}));

const item: MyTask["item"] = {
  id: "8f6c1c1e-0000-4000-8000-000000000000",
  idea: "60s reel: 3 security myths",
  goal: "Grow sign-ups",
  platforms: ["tiktok"],
  type: "short_video",
  publishDate: "2026-10-27",
  goldenTime: "19:30:00",
  status: "in_progress",
  assetLinks: ["https://drive.example/a"],
};

const prep: MyTask = {
  key: "task-1",
  task: {
    id: "8f6c1c1e-0000-4000-8000-0000000000a1",
    name: "Content prep",
    status: "in_progress",
    dueDate: "2026-10-22",
    waitingFor: null,
  },
  item,
};

const today = "2026-10-24";

test("shows each task with its item, due day and status", () => {
  renderWithIntl(<TaskList tasks={[prep]} today={today} />);
  expect(screen.getByText("Content prep")).toBeInTheDocument();
  expect(screen.getByText("Overdue: Thu 22 Oct")).toBeInTheDocument();
  expect(screen.getByText("Tue, 27 Oct 2026 · 19:30")).toBeInTheDocument();
  expect(screen.getByText("Short video")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "60s reel: 3 security myths" }),
  ).toHaveAttribute("href", `/en/my-tasks/${item.id}`);
  expect(
    screen.getByRole("combobox", {
      name: "Status of Content prep for 60s reel: 3 security myths",
    }),
  ).toHaveValue("in_progress");
});

test("shows an empty state", () => {
  renderWithIntl(<TaskList tasks={[]} today={today} />);
  expect(screen.getByText("Nothing for you yet")).toBeInTheDocument();
});

test("groups to do, waiting and done, and says who a waiting task waits on", () => {
  renderWithIntl(
    <TaskList
      tasks={[
        {
          key: "task-2",
          task: {
            id: "8f6c1c1e-0000-4000-8000-0000000000a2",
            name: "Publishing",
            status: "waiting",
            dueDate: "2026-10-27",
            waitingFor: { name: "Asset prep", assigneeName: "Jay" },
          },
          item,
        },
        prep,
        {
          key: item.id,
          task: null,
          item: { ...item, idea: "Old carousel", status: "published" },
        },
      ]}
      today={today}
    />,
  );
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings.map((heading) => heading.textContent)).toEqual([
    "To do1",
    "Waiting1",
    "Done1",
  ]);
  expect(screen.getByText("After Asset prep by Jay")).toBeInTheDocument();
  // A waiting task can't be started yet, so it shows a badge, not a picker.
  expect(
    screen.queryByRole("combobox", { name: /Publishing/ }),
  ).not.toBeInTheDocument();
  // An item from before tasks keeps its own status picker.
  expect(
    screen.getByRole("combobox", { name: "Status of Old carousel" }),
  ).toHaveValue("published");
});
