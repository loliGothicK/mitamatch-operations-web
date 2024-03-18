import * as React from "react";
import Box from "@mui/material/Box";
import { useAtom } from "jotai";
import { basicStatusFilterAtom, labelFilterAtom } from "@/jotai/atom";
import { allBasicStatusSearch, labelSearch } from "@/type/SearchType";
import { CheckBoxItem } from "@/component/CheckBoxItem";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { statusToJapanese } from "@/utils/parser/skill";

function LabelCheckbox() {
  const [filter, setFilter] = useAtom(labelFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {labelSearch.map((flag) => {
        return (
          <CheckBoxItem
            key={flag}
            name={flag}
            checked={filter.includes(flag)}
            handleChange={() => {
              setFilter((prev) => {
                if (filter.includes(flag)) {
                  return prev.filter((v) => v !== flag);
                } else {
                  return [...prev, flag];
                }
              });
            }}
          />
        );
      })}
    </Box>
  );
}

function BasicStatusCheckbox() {
  const [filter, setFilter] = useAtom(basicStatusFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {allBasicStatusSearch().map((flag) => {
        return (
          <CheckBoxItem
            key={statusToJapanese(flag)}
            name={statusToJapanese(flag)}
            checked={filter.some(
              (v) => v.status === flag.status && v.upDown === flag.upDown,
            )}
            handleChange={() => {
              setFilter((prev) => {
                if (
                  filter.some(
                    (v) => v.status === flag.status && v.upDown === flag.upDown,
                  )
                ) {
                  return prev.filter(
                    (v) => v.status !== flag.status || v.upDown !== flag.upDown,
                  );
                } else {
                  return [...prev, flag];
                }
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export default function Search() {
  const [value, setValue] = React.useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="ラベル" value="1" />
            <Tab label="基礎ステータス" value="2" />
            <Tab label="属性ステータス" value="3" />
            <Tab label="その他" value="4" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <LabelCheckbox />
        </TabPanel>
        <TabPanel value="2">
          <BasicStatusCheckbox />
        </TabPanel>
        <TabPanel value="3">Coming soon...</TabPanel>
        <TabPanel value="4">Coming soon...</TabPanel>
      </TabContext>
    </Box>
  );
}
