import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the server actions
vi.mock("@/_actions/invite", () => ({
  getPendingInvitesAction: vi.fn(),
  acceptInviteAction: vi.fn(),
  declineInviteAction: vi.fn(),
  inviteUsersByUsernameAction: vi.fn(),
}));

vi.mock("@/_actions/legion", () => ({
  createLegionAction: vi.fn(),
}));

import {
  getPendingInvitesAction,
  acceptInviteAction,
  declineInviteAction,
} from "@/_actions/invite";
import { NotificationsMenu } from "./NotificationsMenu";

describe("NotificationsMenu", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("renders with no notifications when empty", async () => {
    vi.mocked(getPendingInvitesAction).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsMenu />
      </QueryClientProvider>,
    );

    // Wait for the query to finish (badge should not display a number if 0, depending on implementation, but let's check the bell button)
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("No new notifications")).toBeInTheDocument();
    });
  });

  it("renders invites and allows accepting", async () => {
    vi.mocked(getPendingInvitesAction).mockResolvedValue([
      {
        id: "invite-1",
        organizationId: "legion-1",
        organizationName: "Test Legion",
        createdAt: "2023-01-01T00:00:00Z",
      },
    ]);
    vi.mocked(acceptInviteAction).mockResolvedValue({ success: true });

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsMenu />
      </QueryClientProvider>,
    );

    // Open menu
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Verify invite is displayed
    await waitFor(() => {
      expect(screen.getByText("Test Legion")).toBeInTheDocument();
    });

    // Click Accept
    const acceptBtn = screen.getByRole("button", { name: "Accept" });
    fireEvent.click(acceptBtn);

    // Verify action called
    await waitFor(() => {
      expect(acceptInviteAction).toHaveBeenCalledWith("invite-1");
    });
  });

  it("renders invites and allows declining", async () => {
    vi.mocked(getPendingInvitesAction).mockResolvedValue([
      {
        id: "invite-2",
        organizationId: "legion-2",
        organizationName: "Evil Legion",
        createdAt: "2023-01-01T00:00:00Z",
      },
    ]);
    vi.mocked(declineInviteAction).mockResolvedValue({ success: true });

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsMenu />
      </QueryClientProvider>,
    );

    // Open menu
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Evil Legion")).toBeInTheDocument();
    });

    // Click Decline
    const declineBtn = screen.getByRole("button", { name: "Decline" });
    fireEvent.click(declineBtn);

    // Verify action called
    await waitFor(() => {
      expect(declineInviteAction).toHaveBeenCalledWith("invite-2");
    });
  });
});
