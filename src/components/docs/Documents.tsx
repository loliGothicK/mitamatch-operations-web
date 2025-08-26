'use client';

import { tocAtom } from '@/jotai/docsAtoms';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItemText,
  Stack,
} from '@mui/material';
import { useAtom } from 'jotai';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';

/**
 * Represents an item in the table of contents (TOC).
 */
type TocItem = {
  /**
   * The name of the TOC item.
   */
  name: string;

  /**
   * The slug of the TOC item.
   */
  slug: string;

  /**
   * Optional children of the TOC item.
   */
  children?: TocItem[];
};

/**
 * Creates a new TocItem object based on the provided parameters.
 *
 * @param name - The name of the TocItem.
 * @param slug - The slug of the TocItem.
 * @param children - The children TocItems of the TocItem.
 * @returns A new TocItem object.
 */
function createData({ name, slug, children }: TocItem): TocItem {
  return {
    name,
    slug,
    children: children?.map(child =>
      createData({
        name: child.name,
        slug: `${slug}/${child.slug}`,
        children: child.children,
      }),
    ),
  };
}

/**
 * Renders a row in the document list.
 *
 * @param props - The props for the row component.
 * @param props.row - The data for the row.
 * @returns The rendered row component.
 */
function Row(props: { row: ReturnType<typeof createData> }) {
  const { row } = props;
  const [toc, setToc] = useAtom(tocAtom);

  return (
    <Stack>
      <Grid
        container
        direction={'row'}
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {row.children && toc === row.name ? (
          <Button onClick={() => setToc('')}>
            <KeyboardArrowDown />
          </Button>
        ) : (
          <Button onClick={() => setToc(row.name)}>
            <KeyboardArrowRight />
          </Button>
        )}
        <Link
          href={`/docs/${row.slug}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <ListItemText primary={row.name} style={{ marginLeft: '0.5rem' }} />
        </Link>
      </Grid>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {toc === row.name && (
          <>
            <Divider orientation={'vertical'} flexItem sx={{ marginLeft: 4 }} />
            <List sx={{ marginLeft: '2rem' }}>
              {row.children?.map(child => (
                <Row key={child.name} row={child} />
              ))}
            </List>
          </>
        )}
      </Box>
    </Stack>
  );
}

const rows = [
  createData({
    name: 'Deck Builder',
    slug: 'deck-builder',
    children: [
      { name: 'Builder', slug: 'builder' },
      { name: 'Calculator', slug: 'calculator' },
    ],
  }),
  createData({
    name: 'Timeline Builder',
    slug: 'timeline-builder',
    children: [
      { name: 'Builder', slug: 'builder' },
      { name: 'Edit', slug: 'edit' },
    ],
  }),
  createData({
    name: 'Flow Chart',
    slug: 'flowchart',
    children: [{ name: 'How to use', slug: 'how-to-use' }],
  }),
];

/**
 * Renders a component that displays a list of documents and a content area.
 *
 * @param children - The MDX document.
 */
export function Documents({ children }: PropsWithChildren) {
  return (
    <Grid
      container
      direction={'row'}
      style={{ minHeight: '100vh' }}
      sx={{ my: 10 }}
    >
      <Grid size={{ xs: 12, lg: 3 }}>
        <List
          style={{
            position: 'sticky',
            top: 70,
            maxHeight: 'calc(100vh - 70px)',
          }}
        >
          {rows.map(row => (
            <Row key={row.name} row={row} />
          ))}
        </List>
      </Grid>
      <Grid size={{ xs: 12, lg: 9 }}>{children}</Grid>
    </Grid>
  );
}
