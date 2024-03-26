import * as React from 'react';

import Link from 'next/link';

import { Home, Schema, ViewCompact, ViewTimeline } from '@mui/icons-material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Badge } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

const links = [
  {
    title: 'Home',
    href: '/',
    icon: <Home />,
  },
  {
    title: 'Deck Builder',
    href: '/deck-builder',
    icon: <ViewCompact />,
  },
  {
    title: 'Timeline Builder',
    href: '/timeline-builder',
    icon: <ViewTimeline />,
  },
  {
    title: 'Flow Chart',
    href: '/flowchart',
    icon: (
      <Badge badgeContent={'preview'} color="primary">
        <Schema />
      </Badge>
    ),
  },
];

export const mainListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Menu
    </ListSubheader>
    {links.map(({ title, href, icon }, index) => {
      return (
        <Link href={href} key={index}>
          <ListItemButton>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        </Link>
      );
    })}
  </React.Fragment>
);

const updates = [
  {
    name: 'Timeline Builder for Web is now available (preview)',
    description: [
      'Timeline Builder is now available for Web (preview).',
      'You can create, edit, and share your order timeline.',
    ],
  },
  {
    name: 'Deck Builder for Web is fully functional',
    description: ['Deck Builder all features are now available.'],
  },
  {
    name: 'Mitamatch Operations for Web',
    description: ['Deck Builder is now available (preview).'],
  },
];

export const UpdateListItems = (
  <React.Fragment>
    {updates.map((item) => {
      return (
        <ListItemButton key={item.name}>
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText
            primary={item.name}
            secondary={
              <>
                {item.description.map((line, index) => {
                  return (
                    <Typography fontSize={12} key={index}>
                      {line}
                    </Typography>
                  );
                })}
              </>
            }
          />
        </ListItemButton>
      );
    })}
  </React.Fragment>
);
