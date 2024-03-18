import * as React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import { useAtom } from "jotai";
import { labelFilterAtom } from "@/jotai/atom";
import { labelSearch } from "@/type/SearchType";
import { CheckBoxItem } from "@/component/CheckBoxItem";

function LabelCheckbox() {
  const [filter, setFilter] = useAtom(labelFilterAtom);

  return (
    <div>
      <FormControlLabel
        label={"ラベル"}
        control={
          <Checkbox
            checked={filter.length === labelSearch.length}
            indeterminate={
              filter.length > 0 && filter.length < labelSearch.length
            }
            onChange={() => {
              setFilter((prev) => {
                if (filter.length === labelSearch.length) {
                  return [
                    ...prev.filter(
                      (v) => !(labelSearch as readonly string[]).includes(v),
                    ),
                  ];
                } else {
                  return [
                    ...prev.filter(
                      (v) => !(labelSearch as readonly string[]).includes(v),
                    ),
                    ...labelSearch,
                  ];
                }
              });
            }}
          />
        }
      />
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
    </div>
  );
}

export default function Search() {
  return (
    <Grid container columns={3}>
      <Grid item>
        <LabelCheckbox />
      </Grid>
    </Grid>
  );
}
