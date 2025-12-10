"use client";

import { Provider, getDefaultStore } from "jotai";
import Footer from "@/components/Footer";
import { DarkMode, LightMode } from "@mui/icons-material";
import {
  AppBar as MuiAppBar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  MenuItem,
  Stack,
  Toolbar,
  Menu,
  Typography,
  Drawer as MuiDrawer,
  List,
  Divider,
} from "@mui/material";
import { createTheme, styled, useTheme } from "@mui/material/styles";
import { ThemeProvider, useMediaQuery } from "@mui/system";
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { match } from "ts-pattern";
import { darkTheme, lightTheme } from "@/theme/theme";
import Grid from "@mui/material/Grid";
import Link from "@/components/link";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { mainListItems, userListItems } from "@/components/home/listItems";
import User from "@/components/clerk/User";
import { Project } from "@/components/project/Project";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  position: "relative",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

const MenuIcons = styled(MuiDrawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    overflowX: "hidden",
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(7),
    },
  },
}));

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export type UserData = { userId: string; legions: { id: string; name: string; role: string }[] };

function LayoutMain({ children, userData }: PropsWithChildren<{ userData: UserData | undefined }>) {
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "50px auto 1fr",
        gridTemplateRows: "auto 1fr auto",
        gridTemplateAreas: `
        "header header header"
        "navigation content content"
        "footer footer footer"
      `,
      }}
    >
      <AppBar position="absolute" sx={{ gridArea: "header" }}>
        <Toolbar sx={{ gap: 1, px: 2 }} component="nav" disableGutters={true}>
          <Link href="/" sx={{ pr: 2 }}>
            <Image src="/MitamaLabLogo.png" alt="logo" width={40} height={40} priority={true} />
          </Link>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{
              fontSize: "2rem",
              fontWeight: 500,
              backgroundColor: `linear-gradient(to right, ${theme.palette.action.active}, ${theme.palette.action.disabled})`,
              letterSpacing: "-0.5px",
              fontFamily: "Copperplate Gothic, sans-serif",
            }}
          >
            Mitamatch Operations
          </Typography>
          {userData && <Project legions={userData.legions} />}
          <Divider orientation="vertical" flexItem sx={{ ml: 1, flexGrow: 0.5 }} />
          <Stack>
            <PopupState
              variant="popover"
              popupId="demo-popup-menu"
              disableAutoFocus={false}
              parentPopupState={null}
            >
              {(popupState) => (
                <>
                  <Button {...bindTrigger(popupState)}>{"Docs"}</Button>
                  <Menu {...bindMenu(popupState)}>
                    {(["Deck Builder", "Timeline Builder", "Flowchart"] as const).map((kind) => {
                      return (
                        <MenuItem
                          key={kind}
                          onClick={() => {
                            popupState.close();
                            redirect(`/docs/${kind.toLowerCase().split(" ").join("-")}`);
                          }}
                        >
                          {kind}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                </>
              )}
            </PopupState>
          </Stack>
          <Box flexGrow={0.5} />
          <Divider orientation="vertical" flexItem />
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === "dark" ? <DarkMode /> : <LightMode />}
          </IconButton>
          <User />
        </Toolbar>
      </AppBar>
      <MenuIcons variant="permanent" sx={{ gridArea: "navigation" }}>
        <List component="nav">{mainListItems}</List>
        <Divider />
        {userData && <List component="nav">{userListItems}</List>}
      </MenuIcons>
      <Grid
        container
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          margin: 0,
          padding: 0,
          gridArea: "content",
          overflow: "auto",
        }}
      >
        {children}
      </Grid>
      <Footer sx={{ gridArea: "footer" }} />
    </Box>
  );
}

export function Layout({ children, userData }: PropsWithChildren<{ userData?: UserData }>) {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          if (prevMode === "light") {
            localStorage.setItem("paletteMode", "dark");
            return "dark";
          }
          localStorage.setItem("paletteMode", "light");
          return "light";
        });
      },
    }),
    [],
  );

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    if (localStorage.getItem("paletteMode") === "dark") {
      setMode("dark");
    } else if (localStorage.getItem("paletteMode") === "light") {
      setMode("light");
    } else if (prefersDarkMode) {
      setMode("dark");
    } else {
      setMode("light");
    }
  }, [prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: match(mode)
          .with("light", () => lightTheme.palette)
          .with("dark", () => darkTheme.palette)
          .exhaustive(),
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Provider store={defaultStore}>
          <CssBaseline />
          <LayoutMain userData={userData}>{children}</LayoutMain>
        </Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

const defaultStore = getDefaultStore();
