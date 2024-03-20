import * as React from "react";
import Box from "@mui/material/Box";
import { useAtom } from "jotai";
import {
  assistSupportFilterAtom,
  basicStatusFilterAtom,
  elementStatusFilterAtom,
  labelFilterAtom,
  recoverySupportFilterAtom,
  vanguardSupportFilterAtom,
} from "@/jotai/atom";
import {
  allAssistSupportSearch,
  allBasicStatusSearch,
  allElementStatusSearch,
  allRecoverySupportSearch,
  allVanguardSupportSearch,
  labelSearch,
} from "@/type/SearchType";
import { CheckBoxItem } from "@/component/CheckBoxItem";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {
  intoStatusPattern,
  statusPatternToJapanese,
} from "@/component/Details";

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
            key={intoStatusPattern(flag)}
            name={statusPatternToJapanese(intoStatusPattern(flag))}
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

function ElementStatusCheckbox() {
  const [filter, setFilter] = useAtom(elementStatusFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {allElementStatusSearch().map((flag) => {
        return (
          <CheckBoxItem
            key={intoStatusPattern(flag)}
            name={statusPatternToJapanese(intoStatusPattern(flag))}
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

export function VanguardSupportCheckbox() {
  const [filter, setFilter] = useAtom(vanguardSupportFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {allVanguardSupportSearch().map((flag) => {
        if (typeof flag === "string") {
          return (
            <CheckBoxItem
              key={flag}
              name={
                flag === "NormalMatchPtUp"
                  ? "獲得マッチPtUP/通常単体"
                  : flag === "SpecialMatchPtUp"
                    ? "獲得マッチPtUP/特殊単体"
                    : "DamageUp"
              }
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
        } else {
          return (
            <CheckBoxItem
              key={intoStatusPattern(flag)}
              name={statusPatternToJapanese(intoStatusPattern(flag))}
              checked={filter.some(
                (v) =>
                  typeof v !== "string" &&
                  v.status === flag.status &&
                  v.upDown === flag.upDown,
              )}
              handleChange={() => {
                setFilter((prev) => {
                  if (
                    filter.some(
                      (v) =>
                        typeof v !== "string" &&
                        v.status === flag.status &&
                        v.upDown === flag.upDown,
                    )
                  ) {
                    return prev.filter(
                      (v) =>
                        typeof v !== "string" &&
                        (v.status !== flag.status || v.upDown !== flag.upDown),
                    );
                  } else {
                    return [...prev, flag];
                  }
                });
              }}
            />
          );
        }
      })}
    </Box>
  );
}

export function AssistSupportCheckbox() {
  const [filter, setFilter] = useAtom(assistSupportFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {allAssistSupportSearch().map((flag) => {
        if (typeof flag === "string") {
          return (
            <CheckBoxItem
              key={flag}
              name={"支援UP"}
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
        } else {
          return (
            <CheckBoxItem
              key={intoStatusPattern(flag)}
              name={statusPatternToJapanese(intoStatusPattern(flag))}
              checked={filter.some(
                (v) =>
                  typeof v !== "string" &&
                  v.status === flag.status &&
                  v.upDown === flag.upDown,
              )}
              handleChange={() => {
                setFilter((prev) => {
                  if (
                    filter.some(
                      (v) =>
                        typeof v !== "string" &&
                        v.status === flag.status &&
                        v.upDown === flag.upDown,
                    )
                  ) {
                    return prev.filter(
                      (v) =>
                        typeof v !== "string" &&
                        (v.status !== flag.status || v.upDown !== flag.upDown),
                    );
                  } else {
                    return [...prev, flag];
                  }
                });
              }}
            />
          );
        }
      })}
    </Box>
  );
}

export function RecoverySupportCheckbox() {
  const [filter, setFilter] = useAtom(recoverySupportFilterAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
      {allRecoverySupportSearch().map((flag) => {
        if (typeof flag === "string") {
          return (
            <CheckBoxItem
              key={flag}
              name={"回復UP"}
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
        } else {
          return (
            <CheckBoxItem
              key={intoStatusPattern(flag)}
              name={statusPatternToJapanese(intoStatusPattern(flag))}
              checked={filter.some(
                (v) =>
                  typeof v !== "string" &&
                  v.status === flag.status &&
                  v.upDown === flag.upDown,
              )}
              handleChange={() => {
                setFilter((prev) => {
                  if (
                    filter.some(
                      (v) =>
                        typeof v !== "string" &&
                        v.status === flag.status &&
                        v.upDown === flag.upDown,
                    )
                  ) {
                    return prev.filter(
                      (v) =>
                        typeof v !== "string" &&
                        (v.status !== flag.status || v.upDown !== flag.upDown),
                    );
                  } else {
                    return [...prev, flag];
                  }
                });
              }}
            />
          );
        }
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
          <TabList
            onChange={handleChange}
            variant={"scrollable"}
            scrollButtons="auto"
          >
            <Tab label="ラベル" value="1" />
            <Tab label="基礎ステータス（スキル）" value="2" />
            <Tab label="属性ステータス（スキル）" value="3" />
            <Tab label="その他（スキル）" value="4" />
            <Tab label="前衛（補助スキル）" value="5" />
            <Tab label="支援妨害（補助スキル）" value="6" />
            <Tab label="回復（補助スキル）" value="7" />
            <Tab label="その他（補助スキル）" value="8" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <LabelCheckbox />
        </TabPanel>
        <TabPanel value="2">
          <BasicStatusCheckbox />
        </TabPanel>
        <TabPanel value="3">
          <ElementStatusCheckbox />
        </TabPanel>
        <TabPanel value="4">Coming soon...</TabPanel>
        <TabPanel value="5">
          <VanguardSupportCheckbox />
        </TabPanel>
        <TabPanel value="6">
          <AssistSupportCheckbox />
        </TabPanel>
        <TabPanel value="7">
          <RecoverySupportCheckbox />
        </TabPanel>
        <TabPanel value="8">Coming soon...</TabPanel>
      </TabContext>
    </Box>
  );
}
