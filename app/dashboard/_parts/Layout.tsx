"use client";

import { Box, Tab, Tabs, Typography } from "@mui/material";
import { ReactNode, SyntheticEvent, useState } from "react";
import { UserData } from "@/types/user";
import { Memoria } from "@/dashboard/_parts/Memoria";
import { LegionManagement } from "@/dashboard/_parts/Legion";
import { OrderRegistration } from "@/dashboard/_parts/Order";
import { createLegionAction } from "@/_actions/legion";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export function Dashboard({ userData }: { userData: UserData }) {
  const [value, setValue] = useState(1);
  const user = userData.user;
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLegionName, setNewLegionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const onLegionCreateSubmit = async () => {
    if (!newLegionName) return;
    setIsCreating(true);
    try {
      await createLegionAction(newLegionName);
      setCreateDialogOpen(false);
      setNewLegionName("");
      router.refresh();
    } catch (e) {
      Sentry.captureException(e, {
        extra: { action: "createLegionAction", legionName: newLegionName },
      });
      console.error("Failed to create legion", e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(() => newValue);
  };

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab key={"overview"} label={"overview"} {...a11yProps(0)} />
          <Tab key={"memoria"} label={"memoria"} {...a11yProps(1)} />
          <Tab key={"order"} label={"order"} {...a11yProps(2)} />
          <Tab key={"legion"} label={"legion"} {...a11yProps(3)} />
        </Tabs>
      </Box>
      <CustomTabPanel index={0} value={value} key={"overview"}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 600 }}>
          <Typography variant="h5">Welcome, {userData.user.name}</Typography>

          <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Legions
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are currently a member of {userData.legions.length} legion(s).
              {userData.legions.length > 0 && (
                <ul>
                  {userData.legions.map((l) => (
                    <li key={l.id}>
                      {l.name} ({l.role === "org:admin" ? "Admin" : "Member"})
                    </li>
                  ))}
                </ul>
              )}
            </Typography>
            <Button variant="outlined" onClick={() => setCreateDialogOpen(true)}>
              Create New Legion
            </Button>
          </Box>
        </Box>

        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
          <DialogTitle>レギオン（組織）の新規作成</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="レギオン名"
              type="text"
              fullWidth
              variant="outlined"
              value={newLegionName}
              onChange={(e) => setNewLegionName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
              キャンセル
            </Button>
            <Button
              onClick={onLegionCreateSubmit}
              disabled={!newLegionName || isCreating}
              variant="contained"
            >
              作成
            </Button>
          </DialogActions>
        </Dialog>
      </CustomTabPanel>
      <CustomTabPanel index={1} value={value} key={"memoria"}>
        <Memoria user={user} />
      </CustomTabPanel>
      <CustomTabPanel index={2} value={value} key={"order"}>
        <OrderRegistration user={user} />
      </CustomTabPanel>
      <CustomTabPanel index={3} value={value} key={"legion"}>
        <LegionManagement userData={userData} />
      </CustomTabPanel>
    </Box>
  );
}
