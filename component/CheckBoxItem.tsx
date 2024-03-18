import * as React from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export function CheckBoxItem({
  name,
  checked,
  handleChange,
}: {
  name: string;
  checked: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormControlLabel
      label={name}
      control={<Checkbox checked={checked} onChange={handleChange} />}
    />
  );
}
