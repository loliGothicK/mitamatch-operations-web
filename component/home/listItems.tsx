import * as React from 'react';

import Link from 'next/link';

import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

const links = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Deck Builder',
    href: '/deck-builder',
  },
  {
    title: 'Timeline Builder',
    href: '/timeline-builder',
  },
];

export const mainListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Menu
    </ListSubheader>
    {links.map(({ title, href }, index) => {
      return (
        <Link href={href} key={index}>
          <ListItemButton>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        </Link>
      );
    })}
  </React.Fragment>
);

const updates = [
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
                  return <Typography key={index}>{line}</Typography>;
                })}
              </>
            }
          />
        </ListItemButton>
      );
    })}
  </React.Fragment>
);
