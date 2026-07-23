"use client";

import { Box, Tab, Tabs, Typography } from "@mui/material";
import { ReactNode, SyntheticEvent, useState } from "react";
import { UserData } from "@/types/user";
import { Memoria } from "@/dashboard/_parts/Memoria";
import { LegionManagement } from "@/dashboard/_parts/Legion";
import { OrderRegistration } from "@/dashboard/_parts/Order";

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
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab key={"overview"} label={"overview"} {...a11yProps(0)} />
          <Tab key={"memoria"} label={"memoria"} {...a11yProps(1)} />
          <Tab key={"order"} label={"order"} {...a11yProps(2)} />
          <Tab key={"legion"} label={"legion"} {...a11yProps(3)} />
        </Tabs>
      </Box>
      <CustomTabPanel index={0} value={value} key={"overview"}>
        <Typography variant="h6" component="div">
          {"Overview"}
        </Typography>
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
