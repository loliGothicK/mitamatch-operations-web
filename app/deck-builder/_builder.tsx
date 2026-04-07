"use client";

import { DeckBuilder } from "@/deck-builder/_tabs/builder";
import { Box, IconButton, Tab, Tabs, Tooltip } from "@mui/material";
import { ReactNode, SyntheticEvent, useState } from "react";
import { Calculator } from "@/deck-builder/_tabs/calculator";
import HelpOutline from "@mui/icons-material/HelpOutline";
import { DeckBuilderTour } from "@/deck-builder/_tour";

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

export function DeckBuilderPage({ user }: { user: { id: string; name: string } | undefined }) {
  const [value, setValue] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

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
      <DeckBuilderTour replayKey={replayKey} />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center" }} data-tour="deck-tabs">
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            sx={{ flexGrow: 1 }}
          >
            <Tab key={"builder"} label={"Builder"} {...a11yProps(0)} />
            <Tab
              key={"calculator"}
              label={"Calculator"}
              {...a11yProps(1)}
              sx={{ marginLeft: "auto" }}
            />
          </Tabs>
          <Tooltip title="Tour">
            <IconButton onClick={() => setReplayKey((prev) => prev + 1)}>
              <HelpOutline />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <CustomTabPanel index={0} value={value} key={"untitled"}>
        <DeckBuilder user={user} />
      </CustomTabPanel>
      <CustomTabPanel index={1} value={value} key={"calculator"}>
        <Calculator />
      </CustomTabPanel>
    </Box>
  );
}
