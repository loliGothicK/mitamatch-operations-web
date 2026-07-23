import {
  Badge,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { Notifications } from "@mui/icons-material";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingInvitesAction, acceptInviteAction, declineInviteAction } from "@/_actions/invite";

export const NotificationsMenu = () => {
  const { data: invites } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: () => getPendingInvitesAction(),
  });
  
  const queryClient = useQueryClient();
  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptInviteAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-invites"] }),
  });
  const declineMutation = useMutation({
    mutationFn: (id: string) => declineInviteAction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-invites"] }),
  });

  return (
    <PopupState variant="popover" popupId="notifications-popup">
      {(popupState) => (
        <>
          <IconButton sx={{ ml: 1 }} color="inherit" {...bindTrigger(popupState)}>
            <Badge badgeContent={invites?.length || 0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Menu {...bindMenu(popupState)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {invites?.length ? (
              invites.map((invite) => (
                <MenuItem key={invite.id} sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="body2">
                    Invited to <b>{invite.organizationName}</b>
                  </Typography>
                  <Button size="small" variant="contained" color="primary" onClick={(e) => {
                    e.stopPropagation();
                    acceptMutation.mutate(invite.id);
                  }}>
                    Accept
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={(e) => {
                    e.stopPropagation();
                    declineMutation.mutate(invite.id);
                  }}>
                    Decline
                  </Button>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No new notifications</MenuItem>
            )}
          </Menu>
        </>
      )}
    </PopupState>
  );
};
