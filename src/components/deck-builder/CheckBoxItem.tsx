import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { ChangeEvent } from 'react';

export function CheckBoxItem({
  name,
  checked,
  handleChange,
}: {
  name: string;
  checked: boolean;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormControlLabel
      label={name}
      control={<Checkbox checked={checked} onChange={handleChange} />}
    />
  );
}
