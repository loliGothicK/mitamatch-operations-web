import { useAtom } from "jotai";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";

import { CheckBoxItem } from "@/components/deck-builder/CheckBoxItem";
import {
  currentRoleFilterAtom,
  elementFilterAtom,
  labelFilterAtom,
  roleFilterAtom,
} from "@/jotai/memoriaAtoms";
import { type FilterType, labelFilter, roleFilterMap } from "@/types/filterType";
import { elementFilterMap } from "@/components/deck-builder/Details";
import { ATTRIBUTES } from "@/parser/skill";

function RoleCheckbox() {
  const [filter, setFilter] = useAtom(roleFilterAtom);
  const [currentRoleFilter] = useAtom(currentRoleFilterAtom);

  return (
    <div>
      <FormControlLabel
        label={"役割"}
        control={
          <Checkbox
            checked={filter.length === currentRoleFilter.length}
            indeterminate={filter.length > 0 && filter.length < currentRoleFilter.length}
            onChange={() => {
              setFilter((prev) => {
                if (filter.length === currentRoleFilter.length) {
                  return prev.filter(
                    (v) => !(currentRoleFilter as readonly FilterType[]).includes(v),
                  );
                }
                return [
                  ...prev.filter((v) => !(currentRoleFilter as readonly FilterType[]).includes(v)),
                  ...currentRoleFilter,
                ];
              });
            }}
          />
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
        {currentRoleFilter.map((flag) => {
          return (
            <CheckBoxItem
              key={flag}
              name={roleFilterMap[flag]}
              checked={filter.includes(flag)}
              handleChange={() => {
                setFilter((prev) => {
                  if (filter.includes(flag)) {
                    return prev.filter((v) => v !== flag);
                  }
                  return [...prev, flag];
                });
              }}
            />
          );
        })}
      </Box>
    </div>
  );
}

function ElementCheckbox() {
  const [filter, setFilter] = useAtom(elementFilterAtom);

  return (
    <div>
      <FormControlLabel
        label={"属性"}
        control={
          <Checkbox
            checked={filter.length === ATTRIBUTES.length}
            indeterminate={filter.length > 0 && filter.length < ATTRIBUTES.length}
            onChange={() => {
              setFilter((prev) => {
                if (filter.length === ATTRIBUTES.length) {
                  return prev.filter((v) => !(ATTRIBUTES as readonly string[]).includes(v));
                }
                return [
                  ...prev.filter((v) => !(ATTRIBUTES as readonly string[]).includes(v)),
                  ...ATTRIBUTES,
                ];
              });
            }}
          />
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
        {ATTRIBUTES.map((flag) => {
          return (
            <CheckBoxItem
              key={flag}
              name={elementFilterMap[flag]}
              checked={filter.includes(flag)}
              handleChange={() => {
                setFilter((prev) => {
                  if (filter.includes(flag)) {
                    return prev.filter((v) => v !== flag);
                  }
                  return [...prev, flag];
                });
              }}
            />
          );
        })}
      </Box>
    </div>
  );
}

function LabelCheckbox() {
  const [labels, setLabels] = useAtom(labelFilterAtom);

  return (
    <div>
      <FormControlLabel
        label={"ラベル"}
        control={
          <Checkbox
            checked={labels.length === labelFilter.length}
            indeterminate={labels.length > 0 && labels.length < labelFilter.length}
            onChange={() => {
              setLabels((prev) => {
                if (labels.length === labelFilter.length) {
                  return prev.filter((v) => !(labelFilter as readonly string[]).includes(v));
                }
                return [
                  ...prev.filter((v) => !(labelFilter as readonly string[]).includes(v)),
                  ...labelFilter,
                ];
              });
            }}
          />
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
        {labelFilter.map((filter) => {
          return (
            <CheckBoxItem
              key={filter}
              name={filter}
              checked={labels.includes(filter)}
              handleChange={() => {
                setLabels((prev) => {
                  if (labels.includes(filter)) {
                    return prev.filter((v) => v !== filter);
                  }
                  return [...prev, filter];
                });
              }}
            />
          );
        })}
      </Box>
    </div>
  );
}

export default function Filter() {
  return (
    <Grid container columns={3}>
      <Grid>
        <RoleCheckbox />
        <ElementCheckbox />
        <LabelCheckbox />
      </Grid>
    </Grid>
  );
}
