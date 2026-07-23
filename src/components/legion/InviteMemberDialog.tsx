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
  Box,
  Typography,
  CircularProgress,
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
  const [results, setResults] = useState<{ username: string; success: boolean; error?: string }[] | null>(null);

  const handleClose = () => {
    if (isPending) return;
    setUsernames([]);
    setResults(null);
    onClose();
  };

  const handleInvite = () => {
    if (usernames.length === 0) return;
    
    startTransition(async () => {
      try {
        const res = await inviteUsersByUsernameAction(legionId, usernames);
        setResults(res.results);
      } catch (e: any) {
        setResults([{ username: "System", success: false, error: e.message }]);
      }
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Members</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter the Clerk Usernames of the members you want to invite. You can enter multiple usernames.
        </Typography>
        
        <Autocomplete
          multiple
          freeSolo
          options={[] as string[]}
          value={usernames}
          onChange={(_, newValue) => setUsernames(newValue)}
          disabled={isPending || results !== null}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Usernames"
              placeholder="Type username and press Enter"
            />
          )}
        />

        {results && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Result:</Typography>
            {results.map((r, i) => (
              <Typography key={i} variant="body2" color={r.success ? "success.main" : "error.main"}>
                {r.username}: {r.success ? "Invited successfully" : r.error}
              </Typography>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          {results ? "Close" : "Cancel"}
        </Button>
        {!results && (
          <Button onClick={handleInvite} variant="contained" disabled={usernames.length === 0 || isPending}>
            {isPending ? <CircularProgress size={24} /> : "Send Invites"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
