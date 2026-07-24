import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Mock the server action
vi.mock("@/_actions/invite", () => ({
  inviteUsersByUsernameAction: vi.fn(),
}));

import { inviteUsersByUsernameAction } from "@/_actions/invite";
import { InviteMemberDialog } from "./InviteMemberDialog";

describe("InviteMemberDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog when open is true", () => {
    render(<InviteMemberDialog open={true} onClose={vi.fn()} legionId="legion-123" />);
    expect(screen.getByText("Invite Members")).toBeInTheDocument();
  });

  it("calls the invite action when form is submitted", async () => {
    // Setup mock return value
    const mockInvite = vi.mocked(inviteUsersByUsernameAction);
    mockInvite.mockResolvedValue({
      success: true,
      results: [{ username: "testuser", success: true }],
    });

    render(<InviteMemberDialog open={true} onClose={vi.fn()} legionId="legion-123" />);

    // Find the autocomplete input
    const input = screen.getByLabelText("Usernames");

    // Simulate typing a username and pressing Enter to add it to the Autocomplete chip
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Click the "Invite" button
    const sendBtn = screen.getByRole("button", { name: "Invite" });
    fireEvent.click(sendBtn);

    // Verify the server action was called
    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith("legion-123", ["testuser"]);
    });

    // Verify success result is displayed
    await waitFor(() => {
      expect(screen.getByText("Successfully invited 1 user(s).")).toBeInTheDocument();
    });
  });
});
