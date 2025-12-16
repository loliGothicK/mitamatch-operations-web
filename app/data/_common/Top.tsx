"use client";

import { Datagrid as MemoriaDataGrid } from "@/data/_memoria/datagrid";
import { Datagrid as CostumeDataGrid } from "@/data/_costume/datagrid";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useCallback, useState } from "react";
import View from "@/data/_character/view";
import { AppBar, Breadcrumbs, Typography } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Link from "@/components/link";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { match } from "ts-pattern";

const ROUTES = ["memoria", "costume", "character"] as const;

export default function DataPage({ dataType }: { dataType?: (typeof ROUTES)[number] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || undefined;
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
      <TabContext value={value}>
        <TabList onChange={handleChange} aria-label="lab API tabs example">
          <Tab label="Memoria" value={0} />
          <Tab label="Costume" value={1} />
          <Tab label="Character" value={2} />
        </TabList>
        <AppBar position="static" sx={{ backgroundColor: "transparent" }}>
          <Toolbar>
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              <Link underline="hover" color="inherit" href="/data">
                data
              </Link>
              <Typography sx={{ color: "text.primary" }}>{dataType ?? "memoria"}</Typography>
            </Breadcrumbs>
          </Toolbar>
        </AppBar>
        <TabPanel value={0} sx={{ padding: 0 }}>
          {value === 0 && <MemoriaDataGrid initialQuery={query} />}
        </TabPanel>
        <TabPanel value={1} sx={{ padding: 0 }}>{value === 1 && <CostumeDataGrid initialQuery={query} />}</TabPanel>
        <TabPanel value={2}>{value === 2 && <View />}</TabPanel>
      </TabContext>
    </Box>
  );
}
