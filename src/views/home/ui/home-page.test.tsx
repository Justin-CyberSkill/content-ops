import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { HomePage } from "./home-page";

test("renders the heading", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", { level: 1, name: "CS Content Ops" }),
  ).toBeInTheDocument();
});
