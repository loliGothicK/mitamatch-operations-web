import { useAtom } from "jotai";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";

import { CheckBoxItem } from "@/components/deck-builder/CheckBoxItem";
import { currentRoleFilterAtom, elementFilterAtom, roleFilterAtom } from "@/jotai/memoriaAtoms";
import { type FilterType, elementFilter, roleFilterMap } from "@/types/filterType";
import { elementFilterMap } from "@/components/deck-builder/Details";

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
            checked={filter.length === elementFilter.length}
            indeterminate={filter.length > 0 && filter.length < elementFilter.length}
            onChange={() => {
              setFilter((prev) => {
                if (filter.length === elementFilter.length) {
                  return prev.filter((v) => !(elementFilter as readonly string[]).includes(v));
                }
                return [
                  ...prev.filter((v) => !(elementFilter as readonly string[]).includes(v)),
                  ...elementFilter,
                ];
              });
            }}
          />
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", ml: 3 }}>
        {elementFilter.map((flag) => {
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

export default function Filter() {
  return (
    <Grid container columns={3}>
      <Grid>
        <RoleCheckbox />
        <ElementCheckbox />
      </Grid>
    </Grid>
  );
}
