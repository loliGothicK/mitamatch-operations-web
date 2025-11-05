import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Filter from "./Filter";

describe("Filter", () => {
  it("renders the RoleCheckbox component", () => {
    render(<Filter />);
    expect(screen.getByLabelText("役割")).toBeInTheDocument();
  });

  it("renders the ElementCheckbox component", () => {
    render(<Filter />);
    expect(screen.getByLabelText("属性")).toBeInTheDocument();
  });
});
