"use client";

import { DeckBuilder } from "@/deck-builder/_tabs/builder";
import { Layout } from "@/components/Layout";
import { Box, IconButton, Stack, Tab, Tabs } from "@mui/material";
import type { ReactNode, SyntheticEvent } from "react";
import { createStore, Provider, useAtom } from "jotai";
import { useAtomDefault } from "@/jotai/default";
import { activeProjectAtom, builderModeAtom, openProjectListAtom } from "@/jotai/projectAtoms";
import { Close } from "@mui/icons-material";
import { Calculator } from "@/deck-builder/_tabs/calculator";

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
  const [value, setValue] = useAtom(activeProjectAtom);
  const [mode] = useAtomDefault(builderModeAtom);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(() => newValue);
  };

  const projects = [...openProjectList.entries()];

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
            {mode === "user"
              ? projects
                  .map(([name, index]) => {
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
                                  setValue(() => (opens.size > 0 ? [...opens.values()][0] : -1));
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
                  })
                  .concat([
                    <Tab
                      label="Calc"
                      {...a11yProps(projects.length)}
                      // 適用するスタイル: 自動マージンで右に押し出す
                      sx={{ marginLeft: "auto" }}
                    />,
                  ])
              : [
                  <Tab key={"builder"} label={"Builder"} {...a11yProps(0)} />,
                  <Tab
                    key={"calculator"}
                    label={"Calculator"}
                    {...a11yProps(1)}
                    sx={{ marginLeft: "auto" }}
                  />,
                ]}
          </Tabs>
        </Box>
        {mode === "guest"
          ? [
              <CustomTabPanel index={0} value={value} key={"untitled"}>
                <DeckBuilder index={0} />
              </CustomTabPanel>,
              <CustomTabPanel index={1} value={value} key={"calculator"}>
                <Calculator />
              </CustomTabPanel>,
            ]
          : [...openProjectList.entries()].map(([name, index]) => {
              const store = createStore();
              return (
                <CustomTabPanel value={value} index={index} key={name}>
                  <Provider store={store}>
                    <DeckBuilder index={index} />
                  </Provider>
                </CustomTabPanel>
              );
            })}
      </Box>
    </Layout>
  );
}
