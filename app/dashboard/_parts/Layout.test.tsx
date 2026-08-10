import { render } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import { Dashboard } from "./Layout";

// Mock hooks and actions
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/_actions/legion", () => ({
  createLegionAction: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock child components
vi.mock("@/dashboard/_parts/Memoria", () => ({
  Memoria: () => <div data-testid="memoria-mock">Memoria</div>,
}));
vi.mock("@/dashboard/_parts/Legion", () => ({
  LegionManagement: () => <div data-testid="legion-mock">LegionManagement</div>,
}));
vi.mock("@/dashboard/_parts/Order", () => ({
  OrderRegistration: () => <div data-testid="order-mock">OrderRegistration</div>,
}));

const mockUserData = {
  user: { id: "test", name: "test" },
  legions: [{ id: "legion1", name: "Test Legion", role: "org:admin" }],
};

const renderComponent = () => render(<Dashboard userData={mockUserData as any} />);

test("Dashboard Layout - snapshot", () => {
  const { asFragment } = renderComponent();
  expect(asFragment()).toMatchSnapshot();
});
