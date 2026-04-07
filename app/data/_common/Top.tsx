"use client";

import { Datagrid as MemoriaDataGrid } from "@/data/_memoria/datagrid";
import { Datagrid as CostumeDataGrid } from "@/data/_costume/datagrid";
import { DataPageTour } from "@/data/_common/Tour";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useCallback, useState } from "react";
import View from "@/data/_character/view";
import { AppBar, Breadcrumbs, IconButton, Tooltip, Typography } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Link from "@/components/link";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { match } from "ts-pattern";
import HelpOutline from "@mui/icons-material/HelpOutline";

const ROUTES = ["memoria", "costume", "character"] as const;

export default function DataPage({ dataType }: { dataType?: (typeof ROUTES)[number] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || undefined;
  const [replayKey, setReplayKey] = useState(0);
  const [value, setValue] = useState(
    match(dataType)
      .with("memoria", () => 0)
      .with("costume", () => 1)
      .with("character", () => 2)
      .otherwise(() => 0),
  );

  const handleChange = useCallback(
    (_: SyntheticEvent, newValue: number) => {
      setValue(() => newValue);
      router.push(`/data/${ROUTES[newValue]}`, { scroll: false });
    },
    [router, setValue],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <DataPageTour tab={ROUTES[value]} replayKey={replayKey} />
      <TabContext value={value}>
        <TabList onChange={handleChange} aria-label="lab API tabs example" data-tour="data-tabs">
          <Tab label="Memoria" value={0} />
          <Tab label="Costume" value={1} />
          <Tab label="Character" value={2} />
        </TabList>
        <AppBar position="static" sx={{ backgroundColor: "transparent" }}>
          <Toolbar>
            <Breadcrumbs separator="›" aria-label="breadcrumb" data-tour="data-breadcrumbs">
              <Link underline="hover" color="inherit" href="/data">
                data
              </Link>
              <Typography sx={{ color: "text.primary" }}>{dataType ?? "memoria"}</Typography>
            </Breadcrumbs>
            <Box sx={{ marginLeft: "auto" }}>
              <Tooltip title="Tour">
                <IconButton onClick={() => setReplayKey((prev) => prev + 1)}>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <TabPanel value={0} sx={{ padding: 0 }}>
          {value === 0 && <MemoriaDataGrid initialQuery={query} />}
        </TabPanel>
        <TabPanel value={1} sx={{ padding: 0 }}>
          {value === 1 && <CostumeDataGrid initialQuery={query} />}
        </TabPanel>
        <TabPanel value={2}>{value === 2 && <View />}</TabPanel>
      </TabContext>
    </Box>
  );
}
