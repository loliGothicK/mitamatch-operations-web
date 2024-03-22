import * as React from 'react';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

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
