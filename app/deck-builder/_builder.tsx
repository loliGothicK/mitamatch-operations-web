"use client";

import { DeckBuilder } from "@/deck-builder/_tabs/builder";
import { Layout } from "@/components/Layout";
import { Box, IconButton, Stack, Tab, Tabs } from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";
import { createStore, Provider } from "jotai";
import { useAtomDefault } from "@/jotai/default";
import { activeProjectAtom, openProjectListAtom } from "@/jotai/projectAtoms";
import { Close } from "@mui/icons-material";

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

export function DeckBuilderPage() {
  const [openProjectList, setOpenProjectList] = useAtomDefault(openProjectListAtom);
  const [value, setValue] = useAtomDefault(activeProjectAtom);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(() => newValue);
  };

  return (
    <Layout>
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            {[...openProjectList.entries()].map(([name, index]) => {
              return (
                <Tab
                  key={name}
                  value={index}
                  label={
                    <Stack direction={"row"} component={"span"} alignItems={"center"}>
                      {name}
                      <IconButton
                        component={"span"}
                        onClick={() => {
                          setOpenProjectList((opens) => {
                            opens.delete(name);
                            setValue(() => (opens.size > 0 ? [...opens.values()][0] : false));
                            return opens;
                          });
                        }}
                      >
                        <Close sx={{ width: 10, height: 10 }} />
                      </IconButton>
                    </Stack>
                  }
                  {...a11yProps(index)}
                />
              );
            })}
          </Tabs>
        </Box>
        {value === false ? (
          <CustomTabPanel index={0} value={0} key={"untitled"}>
            <DeckBuilder index={0} />
          </CustomTabPanel>
        ) : (
          [...openProjectList.entries()].map(([name, index]) => {
            const store = createStore();
            return (
              <CustomTabPanel value={value} index={index} key={name}>
                <Provider store={store}>
                  <DeckBuilder index={index} />
                </Provider>
              </CustomTabPanel>
            );
          })
        )}
      </Box>
    </Layout>
  );
}
