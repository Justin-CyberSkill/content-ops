import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { HomePage } from "./home-page";

vi.mock("@/shared/auth/index.server", () => ({
  requireUser: () => new Promise(() => {}),
}));

test("renders the heading while the user loads", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { level: 1, name: "CS Content Ops" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Loading…")).toBeInTheDocument();
});
