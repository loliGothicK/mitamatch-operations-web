import Link from 'next/link';

import {
  Assignment,
  DataObject,
  Home,
  Schema,
  ViewCompact,
  ViewTimeline,
} from '@mui/icons-material';
import {
  Badge,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';

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
      <Badge badgeContent={'preview'} color='primary'>
        <Schema />
      </Badge>
    ),
  },
  {
    title: 'Database',
    href: '/database',
    icon: (
      <Badge badgeContent={'preview'} color='primary'>
        <DataObject />
      </Badge>
    ),
  },
];

export const mainListItems = (
  <>
    <ListSubheader component='div' inset>
      Menu
    </ListSubheader>
    {links.map(({ title, href, icon }) => {
      return (
        <Link href={href} key={title}>
          <ListItemButton>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={title} />
          </ListItemButton>
        </Link>
      );
    })}
  </>
);

const updates = [
  {
    name: 'Database is now available (preview)',
    description: [
      'You can check the implementation overview',
      'This feature is still in preview.',
    ],
  },
  {
    name: 'light/dark mode is now available',
    description: ['You can toggle the color mode between light and dark.'],
  },
  {
    name: 'Calculator in Deck Builder is now available for preview',
    description: [
      'You can calculate your deck total damage or recovery, and buff/debuff.',
      'This feature is still in preview.',
    ],
  },
  {
    name: 'Flow Chart is now available for preview',
    description: ['You can create, edit, and share your flow chart.'],
  },
  {
    name: 'Timeline Builder for Web is now generally available (GA)',
    description: [
      'Timeline Builder is now generally available for Web.',
      'You can create, edit, and share your order timeline.',
    ],
  },
  {
    name: 'Deck Builder for Web is fully functional',
    description: ['Deck Builder all features are now available.'],
  },
];

export const UpdateListItems = (
  <>
    {updates.map(item => {
      return (
        <ListItemButton key={item.name}>
          <ListItemIcon>
            <Assignment />
          </ListItemIcon>
          <ListItemText primary={item.name} secondary={item.description} />
        </ListItemButton>
      );
    })}
  </>
);
