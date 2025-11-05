import Link from "next/link";

import {
  Assignment,
  DataArray,
  Schema,
  ViewCompact,
  ViewTimeline,
} from "@mui/icons-material";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

const links = [
  {
    title: "Data",
    href: "/data",
    icon: <DataArray />,
  },
  {
    title: "Deck Builder",
    href: "/deck-builder",
    icon: <ViewCompact />,
  },
  {
    title: "Timeline Builder",
    href: "/timeline-builder",
    icon: <ViewTimeline />,
  },
  {
    title: "Flow Chart",
    href: "/flowchart",
    icon: <Schema />,
  },
];

export const mainListItems = (
  <>
    {links.map(({ title, href, icon }) => {
      return (
        <Tooltip title={title} key={title} arrow placement={"right-end"}>
          <Link href={href}>
            <ListItemButton>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={title} />
            </ListItemButton>
          </Link>
        </Tooltip>
      );
    })}
  </>
);

const updates = [
  {
    name: "Database is now available (preview)",
    description: [
      "You can check the implementation overview",
      "This feature is still in preview.",
    ],
    link: "/database",
  },
  {
    name: "light/dark mode is now available",
    description: ["You can toggle the color mode between light and dark."],
    link: "/",
  },
  {
    name: "Flow Chart is now available for preview",
    description: ["You can create, edit, and share your flow chart."],
    link: "/flowchart",
  },
  {
    name: "Timeline Builder for Web is now generally available (GA)",
    description: [
      "Timeline Builder is now generally available for Web.",
      "You can create, edit, and share your order timeline.",
    ],
    link: "/timeline-builder",
  },
  {
    name: "Deck Builder for Web is fully functional",
    description: ["Deck Builder all features are now available."],
    link: "/deck-builder",
  },
];

export const UpdateListItems = () => {
  const theme = useTheme();
  return (
    <>
      {updates.map((item) => {
        return (
          <Link
            key={item.name}
            href={item.link}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <ListItemButton>
              <ListItemIcon>
                <Assignment />
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                secondary={item.description}
                color={theme.palette.text.secondary}
              />
            </ListItemButton>
          </Link>
        );
      })}
    </>
  );
};
