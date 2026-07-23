"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { inviteUsersByUsernameAction } from "@/_actions/invite";

export function InviteMemberDialog({
  open,
  onClose,
  legionId,
}: {
  open: boolean;
  onClose: () => void;
  legionId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [usernames, setUsernames] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleClose = () => {
    if (isPending) return;
    setUsernames([]);
    setSnackbar({ ...snackbar, open: false });
    onClose();
  };

  const handleInvite = () => {
    if (usernames.length === 0) return;

    startTransition(async () => {
      try {
        const res = await inviteUsersByUsernameAction(legionId, usernames);
        const successes = res.results.filter((r) => r.success);
        const failures = res.results.filter((r) => !r.success);

        if (failures.length > 0) {
          const errorMsg = failures.map((f) => `${f.username} (${f.error})`).join(", ");
          setSnackbar({
            open: true,
            message: `Failed for some users: ${errorMsg}`,
            severity: "error",
          });
        } else {
          setSnackbar({
            open: true,
            message: `Successfully invited ${successes.length} user(s).`,
            severity: "success",
          });
          // Close dialog after successful invite
          setTimeout(() => {
            handleClose();
          }, 1500);
        }
      } catch (e: any) {
        setSnackbar({ open: true, message: e.message, severity: "error" });
      }
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Members</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter the Clerk Usernames of the members you want to invite. You can enter multiple
          usernames.
        </Typography>

        <Autocomplete
          multiple
          freeSolo
          options={[] as string[]}
          value={usernames}
          onChange={(_, newValue) => setUsernames(newValue)}
          disabled={isPending}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Usernames"
              placeholder="Type username and press Enter"
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          disabled={usernames.length === 0 || isPending}
        >
          {isPending ? <CircularProgress size={24} /> : "Invite"}
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
