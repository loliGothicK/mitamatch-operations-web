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
} from "@mui/material";
import { UserData } from "@/types/user";
import { useState } from "react";
import { InviteMemberDialog } from "@/components/legion/InviteMemberDialog";

export function LegionManagement({ userData }: { userData: UserData }) {
  const [selectedLegionId, setSelectedLegionId] = useState<string>(
    userData.legions[0]?.id || "",
  );
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
                    <Box key={m.userId} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">{m.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.role === "org:admin" ? "Admin" : "Member"}
                      </Typography>
                    </Box>
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
                  Invite members using their Clerk Usernames. You can invite multiple members at once.
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
