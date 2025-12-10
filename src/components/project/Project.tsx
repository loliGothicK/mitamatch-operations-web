import { ScatterPlot } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Modal,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { UserData } from "@/components/layout/client";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export function Project({ legions }: { legions: UserData["legions"] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  const [checked, setChecked] = useState<string | undefined>(
    legions.length === 0 ? undefined : legions[0].name,
  );

  const handleToggle = (value: string) => () => {
    setChecked(value);
  };

  return (
    <Box>
      <Modal
        open={modalOpen}
        onClose={handleClose}
        aria-labelledby="legion-modal"
        aria-describedby="legion-modal-description"
      >
        <Box sx={style}>
          <Typography id="legion-modal-title" variant="h6" component="h2">
            Select a Legion
          </Typography>
          <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
            {legions.map(({ name }) => {
              return (
                <ListItem
                  key={name}
                  secondaryAction={
                    <IconButton edge="end" aria-label="comments">
                      <ScatterPlot />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton onClick={handleToggle(name)} dense>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={checked === name}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText id={name} primary={name} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Modal>
      {legions.length > 0 ? (
        <Button variant="outlined" startIcon={<ScatterPlot />} sx={{ ml: 1 }} onClick={handleOpen}>
          {checked || "Select Legion"}
        </Button>
      ) : (
        <Button variant="outlined" startIcon={<ScatterPlot />} sx={{ ml: 1 }} disabled={true}>
          {"Legion"}
        </Button>
      )}
    </Box>
  );
}
