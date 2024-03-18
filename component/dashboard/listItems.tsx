import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import Typography from "@mui/material/Typography";

export const mainListItems = (
  <React.Fragment>
    <ListSubheader component="div" inset>
      Menu
    </ListSubheader>
    <Link href={"/"}>
      <ListItemButton>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </Link>
    <Link href={"/deck-builder"}>
      <ListItemButton>
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary="Deck Builder" />
      </ListItemButton>
    </Link>
  </React.Fragment>
);

const updates = [
  {
    name: "Mitamatch Operations for Web",
    description: ["Deck Builder is now available (preview)."],
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
