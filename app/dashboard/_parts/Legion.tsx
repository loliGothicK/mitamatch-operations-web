"use client";

import {
  Box,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { UserData } from "@/types/user";
import { useState } from "react";
import { InviteMemberDialog } from "@/components/legion/InviteMemberDialog";
import { updateLegionMemberDisplayNameAction } from "@/_actions/legion";
import { useRouter } from "next/navigation";

// Utility component to display and edit a single member
function MemberRow({
  member,
  legionId,
  onUpdate,
}: {
  member: any;
  legionId: string;
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(member.displayName || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateLegionMemberDisplayNameAction(legionId, member.userId, displayName || null);
      setOpen(false);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">{member.displayName || member.name}</Typography>
        {member.displayName && (
          <Typography variant="caption" color="text.secondary">
            (@{member.name})
          </Typography>
        )}
        <IconButton size="small" onClick={() => setOpen(true)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {member.role === "org:admin" ? "Admin" : "Member"}
      </Typography>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit Display Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            type="text"
            fullWidth
            variant="outlined"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function LegionManagement({ userData }: { userData: UserData }) {
  const router = useRouter();
  const [selectedLegionId, setSelectedLegionId] = useState<string>(userData.legions[0]?.id || "");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const selectedLegion = userData.legions.find((l) => l.id === selectedLegionId);
  const isAdmin = selectedLegion?.role === "org:admin";

  if (userData.legions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>
          No legions found. You need to be a part of a legion to use this feature.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6">Select Legion:</Typography>
        <Select
          value={selectedLegionId}
          onChange={(e) => setSelectedLegionId(e.target.value)}
          size="small"
        >
          {userData.legions.map((legion) => (
            <MenuItem key={legion.id} value={legion.id}>
              {legion.name} {legion.role === "org:admin" ? "(Admin)" : "(Member)"}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Grid container spacing={3}>
        {/* Members List (Admin only) */}
        {isAdmin && selectedLegion.members && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Members ({selectedLegion.members.length})
                </Typography>
                <Stack spacing={1}>
                  {selectedLegion.members.map((m) => (
                    <MemberRow
                      key={m.userId}
                      member={m}
                      legionId={selectedLegionId}
                      onUpdate={() => router.refresh()}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Invite Member (Admin only) */}
        {isAdmin && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invite Member
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Invite members using their Clerk Usernames. You can invite multiple members at
                  once.
                </Typography>
                <Button variant="contained" onClick={() => setInviteDialogOpen(true)}>
                  Open Invite Menu
                </Button>
                <InviteMemberDialog
                  open={inviteDialogOpen}
                  onClose={() => setInviteDialogOpen(false)}
                  legionId={selectedLegionId}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
