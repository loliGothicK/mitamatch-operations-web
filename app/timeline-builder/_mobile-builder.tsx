"use client";

import { Suspense, useState } from "react";
import {
  alpha,
  Box,
  Container,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, HelpOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { AutoAssignButton } from "@/timeline-builder/_auto-assign";
import { TimelineBuilderTour } from "@/timeline-builder/_tour";
import { UserData } from "@/types/user";

import { FilterMenu, ShareButton, Source, Timeline } from "./_builder";

export function MobileTimelineBuilderPage({ userData }: { userData?: UserData }) {
  const theme = useTheme();
  const [replayKey, setReplayKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ pb: 10 }}>
      <TimelineBuilderTour
        replayKey={replayKey}
        onStepChange={(stepIndex) => {
          if (stepIndex === 2) {
            setDrawerOpen(true);
          }
        }}
      />

      {/* Tools Section at the top */}
      <Box
        data-tour="timeline-controls"
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAssignButton userData={userData} />
          <ShareButton />
          <Tooltip title="Tour">
            <IconButton onClick={() => setReplayKey((prev) => prev + 1)}>
              <HelpOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Timeline Canvas */}
      <Container
        data-tour="timeline-canvas"
        maxWidth={false}
        sx={{
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255, 0.1)"
              : alpha(theme.palette.primary.main, 0.2),
          minHeight: "80vh",
          paddingTop: 2,
        }}
      >
        <Suspense>
          <Timeline userData={userData} />
        </Suspense>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: theme.zIndex.speedDial,
        }}
        onClick={() => setDrawerOpen(true)}
      >
        <Add />
      </Fab>

      {/* Drawer for Source/Library */}
      <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box
          sx={{
            height: "80vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            bgcolor: theme.palette.background.paper,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="h6">オーダーを選択</Typography>
            <FilterMenu />
          </Box>
          <Divider />
          <Container
            data-tour="timeline-source"
            maxWidth={false}
            sx={{
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255, 0.1)"
                  : alpha(theme.palette.primary.main, 0.2),
              flexGrow: 1,
              overflowY: "auto",
              p: 1,
            }}
          >
            <Source />
          </Container>
        </Box>
      </Drawer>
    </Box>
  );
}
