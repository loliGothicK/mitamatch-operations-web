"use client";

import { Datagrid as MemoriaDataGrid } from "@/data/_memoria/datagrid";
import { Datagrid as CostumeDataGrid } from "@/data/_costume/datagrid";
import { Layout } from "@/components/Layout";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, type SyntheticEvent, useState } from "react";
import NotFound from "next/dist/client/components/builtin/not-found";
import { z } from "zod";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
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

const TABS = [
  {
    label: "Memoria",
    content: (query?: string) => <MemoriaDataGrid initialQuery={query} />,
    disabled: false,
  },
  {
    label: "Costume",
    content: (query?: string) => <CostumeDataGrid initialQuery={query} />,
    disabled: false,
  },
  {
    label: "Order",
    content: (query?: string) => <CostumeDataGrid initialQuery={query} />,
    disabled: true,
  },
];

const ROUTES = ["memoria", "costume", "order"] as const;

const pageSchema = z.enum(["memoria", "costume", "order"]).optional();

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
    router.push(`/data/${ROUTES[newValue]}`);
    setValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            {TABS.map((def, index) => (
              <Tab
                key={def.label}
                label={def.label}
                {...a11yProps(index)}
                disabled={def.disabled}
              />
            ))}
          </Tabs>
        </Box>
        {TABS.map((tab, index) => (
          <CustomTabPanel index={index} value={value} key={tab.label}>
            {tab.content(query)}
          </CustomTabPanel>
        ))}
      </Box>
    </Layout>
  );
}
