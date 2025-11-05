"use client";

import { Provider, getDefaultStore } from "jotai";
import Footer from "@/components/Footer";
import { mainListItems } from "@/components/home/listItems";
import {
  DarkMode,
  LightMode,
  Person,
  Menu as MenuIcon,
  Folder,
} from "@mui/icons-material";
import {
  AppBar as MuiAppBar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  MenuItem,
  Stack,
  Toolbar,
  Menu,
  Typography,
  Tooltip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { createTheme, styled, useTheme } from "@mui/material/styles";
import { ThemeProvider, useMediaQuery } from "@mui/system";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { redirect } from "next/navigation";
import { defaultSession, type SessionData } from "@/session/sessionData";
import Image from "next/image";
import { getSession } from "@/actions/auth";
import ProjectTreeView from "@/components/project";
import { match } from "ts-pattern";
import { darkTheme, lightTheme } from "@/theme/theme";
import Grid from "@mui/material/Grid";
import Link from "@/components/link";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { useAtom } from "jotai";
import { projectOpenAtom } from "@/jotai/projectAtoms";

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

function BasicLayout({ children }: { children: ReactNode }) {
  const [user, setUser] =
    useState<Omit<SessionData, "expires">>(defaultSession);
  const [, setProjectOpen] = useAtom(projectOpenAtom);
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      const user = await getSession();
      if (user) {
        setUser({
          ...user,
          isLoggedIn: true,
        });
      } else {
        setProjectOpen(false);
      }
    })();
  }, [setProjectOpen]);

  const menuDropdown = () => {};

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "50px auto 1fr",
        gridTemplateRows: "auto 1fr auto",
        gridTemplateAreas: `
        "header header header"
        "navigation project content"
        "footer footer footer"
      `,
      }}
    >
      <AppBar position="absolute" sx={{ gridArea: "header" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={menuDropdown}
            sx={{
              marginRight: "36px",
            }}
          >
            <MenuIcon />
          </IconButton>
          <Link href="/" sx={{ pr: 2 }}>
            <Image
              src="/MitamaLabLogo.png"
              alt="logo"
              width={40}
              height={40}
              priority={true}
            />
          </Link>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{
              flexGrow: 0.5,
              fontSize: "2rem",
              fontWeight: 500,
              backgroundColor: `linear-gradient(to right, ${theme.palette.action.active}, ${theme.palette.action.disabled})`,
              letterSpacing: "-0.5px",
              fontFamily: "Copperplate Gothic, sans-serif",
            }}
          >
            Mitamatch Operations
          </Typography>
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
                    {(
                      ["Deck Builder", "Timeline Builder", "Flowchart"] as const
                    )

                      .map((kind) => {
                        return (
                          <MenuItem
                            key={kind}
                            onClick={() => {
                              popupState.close();
                              redirect(
                                `/docs/${kind.toLowerCase().split(" ").join("-")}`,
                              );
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
          <IconButton
            sx={{ ml: 1 }}
            onClick={colorMode.toggleColorMode}
            color="inherit"
          >
            {theme.palette.mode === "dark" ? <DarkMode /> : <LightMode />}
          </IconButton>
          <IconButton onClick={() => redirect("/api/auth/discord")}>
            {user.isLoggedIn ? (
              user.userAvatar !== "default" ? (
                <Image
                  src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.userAvatar}.png`}
                  alt={"avatar"}
                  width={20}
                  height={20}
                />
              ) : (
                <Image
                  src={"https://cdn.discordapp.com/embed/avatars/0.png"}
                  alt={"avatar"}
                  width={20}
                  height={20}
                />
              )
            ) : (
              <Person sx={{ flexGrow: 0.05 }} width={20} height={20} />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <MenuIcons variant="permanent" sx={{ gridArea: "navigation" }}>
        <List component="nav">
          {user.isLoggedIn && (
            <Tooltip
              title={"Project"}
              key={"Project"}
              arrow
              placement={"right-end"}
            >
              <ListItemButton onClick={() => setProjectOpen(true)}>
                <ListItemIcon>
                  <Folder />
                </ListItemIcon>
                <ListItemText primary={"Project"} />
              </ListItemButton>
            </Tooltip>
          )}
          {mainListItems}
        </List>
        <Divider />
      </MenuIcons>
      <ProjectTreeView sx={{ gridArea: "project" }} />
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

export function Layout({ children }: { children: ReactNode }) {
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
          <BasicLayout>{children}</BasicLayout>
        </Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

const defaultStore = getDefaultStore();
