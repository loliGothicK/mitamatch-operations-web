import NextLink from 'next/link';
import { Link as MuiLink } from '@mui/material';
import { ComponentProps, PropsWithChildren } from 'react';

type Props = ComponentProps<typeof MuiLink> & ComponentProps<typeof NextLink>;

export default function Link({ children, ...props }: PropsWithChildren<Props>) {
  return (
    <MuiLink component={NextLink} {...props}>
      {children}
    </MuiLink>
  );
}
