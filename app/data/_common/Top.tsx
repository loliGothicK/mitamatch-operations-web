"use client";

import { Datagrid as MemoriaDataGrid } from "@/data/_memoria/datagrid";
import { Datagrid as CostumeDataGrid } from "@/data/_costume/datagrid";
import { Layout } from "@/components/Layout";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, type SyntheticEvent, useEffect, useMemo, useState } from "react";
import NotFound from "next/dist/client/components/builtin/not-found";
import { z } from "zod";
import View from "@/data/_character/view";
import { AppBar, Breadcrumbs, Typography } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import Link from "@/components/link";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  const isActive = value === index;
  const [hasBeenActive, setHasBeenActive] = useState(isActive);

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        display: isActive ? "block" : "none",
        width: "100%",
      }}
      {...other}
    >
      {hasBeenActive && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const TABS = [
  {
    label: "Memoria",
    content: (query?: string) => <MemoriaDataGrid initialQuery={query} />,
  },
  {
    label: "Costume",
    content: (query?: string) => <CostumeDataGrid initialQuery={query} />,
  },
  {
    label: "Character",
    content: (_?: string) => <View />,
  },
];

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

  const tabContents = useMemo(() => TABS.map((tab) => tab.content(query)), [query]);

  return (
    <Layout>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="data tabs">
            {TABS.map((def, index) => (
              <Tab key={def.label} label={def.label} {...a11yProps(index)} />
            ))}
          </Tabs>
        </Box>
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
        {TABS.map((tab, index) => (
          <CustomTabPanel index={index} value={value} key={tab.label}>
            {tabContents[index]}
          </CustomTabPanel>
        ))}
      </Box>
    </Layout>
  );
}
