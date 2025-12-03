"use client";

import { Datagrid as MemoriaDataGrid } from "@/data/_memoria/datagrid";
import { Datagrid as CostumeDataGrid } from "@/data/_costume/datagrid";
import { Layout } from "@/components/Layout";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import View from "@/data/_character/view";
import { AppBar, Breadcrumbs, Typography } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Link from "@/components/link";
import { z } from "zod";
import NotFound from "next/dist/client/components/builtin/not-found";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

const ROUTES = ["memoria", "costume", "character"] as const;

const pageSchema = z.enum(ROUTES).optional();

export default function DataPage({ dataType }: { dataType?: (typeof ROUTES)[number] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || undefined;

  const parsed = pageSchema.safeParse(dataType);

  if (!parsed.success) {
    console.error(parsed.error);
    return <NotFound />;
  }

  const [value, setValue] = useState(ROUTES.indexOf(parsed.data || "memoria"));

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    router.push(`/data/${ROUTES[newValue]}`, { scroll: false });
    setValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ width: "100%" }}>
        <TabContext value={value}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Memoria" value={0} />
            <Tab label="Costume" value={1} />
            <Tab label="Character" value={2} />
          </TabList>
          <AppBar position="static">
            <Toolbar>
              <Breadcrumbs separator="›" aria-label="breadcrumb">
                <Link underline="hover" color="inherit" href="/data">
                  data
                </Link>
                <Typography sx={{ color: "text.primary" }}>{dataType ?? "memoria"}</Typography>
              </Breadcrumbs>
            </Toolbar>
          </AppBar>
          <TabPanel value={0}>
            <MemoriaDataGrid initialQuery={query} />
          </TabPanel>
          <TabPanel value={1}>
            <CostumeDataGrid initialQuery={query} />
          </TabPanel>
          <TabPanel value={2}>
            <View />
          </TabPanel>
        </TabContext>
      </Box>
    </Layout>
  );
}
