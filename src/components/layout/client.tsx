"use client";

import { Provider, getDefaultStore } from "jotai";
import { useMount } from "react-use";
import Footer from "@/components/Footer";
import { DarkMode, KeyboardArrowDown, LightMode, Menu as MenuIcon } from "@mui/icons-material";
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
import {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  ElementType,
  useMemo,
} from "react";
import { redirect, usePathname } from "next/navigation";
import Image from "next/image";
import { match } from "ts-pattern";
import { darkTheme, lightTheme } from "@/theme/theme";
import Link from "@/components/link";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { mainListItems, userListItems } from "@/components/home/listItems";
import { default as ClerkUser } from "@/components/clerk/User";
import Paper from "@mui/material/Paper";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SimpleTreeView } from "@mui/x-tree-view";
import { Decks } from "@/components/project/Decks";
import { Timelines } from "@/components/project/Timelines";
import type { UserData } from "@/types/user";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";

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

const FireNav = styled(List)<{ component?: ElementType }>({
  "& .MuiListItemButton-root": {
    paddingLeft: 24,
    paddingRight: 24,
  },
  "& .MuiListItemIcon-root": {
    minWidth: 0,
    marginRight: 16,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
});

function LayoutMain({ children, userData }: PropsWithChildren<{ userData: UserData | undefined }>) {
  const colorMode = useContext(ColorModeContext);
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const theme = useTheme();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileDrawerOpen(false);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100vw",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <AppBar position="absolute">
          <Toolbar
            sx={{ gap: 1, px: 2, mx: 0, display: "flex", alignItems: "center" }}
            component="nav"
            disableGutters={true}
          >
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                color="inherit"
                aria-label="Open navigation menu"
                onClick={() => setMobileDrawerOpen((prev) => !prev)}
                edge="start"
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Link href="/" sx={{ pr: 2 }}>
                <Image
                  src="/MitamaLabLogo.png"
                  alt="logo"
                  width={40}
                  height={40}
                  priority={true}
                  unoptimized
                  style={{ width: 40, height: 40 }}
                />
              </Link>
              <Typography
                variant="h6"
                component="div"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {"Mitamatch Operations"}
              </Typography>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ ml: 1, flexGrow: 0.5, display: { xs: "none", md: "block" } }}
            />
            <Stack sx={{ display: { xs: "none", md: "block" } }}>
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
                      {(["Data", "Deck Builder", "Timeline Builder", "Flowchart"] as const).map(
                        (kind) => {
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
                        },
                      )}
                    </Menu>
                  </>
                )}
              </PopupState>
            </Stack>
            <Box sx={{ flexGrow: { xs: 1, md: 0.5 } }} />
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", sm: "block" } }}
            />
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === "dark" ? <DarkMode /> : <LightMode />}
            </IconButton>
            <NotificationsMenu />
            <ClerkUser />
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            flexGrow: 1, // AppBar 以外の高さを全部使う
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md:
                userData && pathname.endsWith("builder")
                  ? "264px minmax(0, 1fr)"
                  : "56px minmax(0, 1fr)",
            },
            overflow: "hidden", // 内部スクロールのために必要
          }}
        >
          {/* サイドバー */}
          <MuiDrawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{
              display: { xs: "block", md: "none" },
              zIndex: (theme) => theme.zIndex.drawer + 2,
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: 264,
                display: "flex",
                flexDirection: "row",
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                borderRight: "1px solid rgba(0,0,0,0.12)",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <List component="nav">{mainListItems}</List>
              <Divider />
              {userData && <List component="nav">{userListItems}</List>}
            </Box>
            {userData && pathname.endsWith("builder") && (
              <FireNav component="nav" disablePadding sx={{ flexGrow: 1, overflowY: "auto" }}>
                <Divider />
                <Box sx={{ pb: 2 }}>
                  <ListItemButton alignItems="flex-start" sx={{ pb: 0, pt: 2.5 }}>
                    <ListItemText
                      primary="Project"
                      slotProps={{
                        primary: {
                          sx: { fontSize: 15, fontWeight: "medium", lineHeight: "20px", mb: "2px" },
                        },
                        secondary: {
                          noWrap: true,
                          sx: { fontSize: 12, lineHeight: "16px", color: "rgba(0,0,0,0)" },
                        },
                      }}
                      secondary="Decks & Timelines"
                      sx={{ my: 0 }}
                    />
                  </ListItemButton>
                  <SimpleTreeView>
                    <Decks />
                    <Timelines />
                  </SimpleTreeView>
                </Box>
              </FireNav>
            )}
          </MuiDrawer>

          <Paper
            elevation={0}
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "row",
              borderRight: "1px solid rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            <MenuIcons variant="permanent">
              <List component="nav">{mainListItems}</List>
              <Divider />
              {userData && <List component="nav">{userListItems}</List>}
            </MenuIcons>
            {userData && pathname.endsWith("builder") && (
              <FireNav component="nav" disablePadding sx={{ width: 208 }}>
                <Divider />
                <Box
                  sx={[
                    open ? { bgcolor: "rgba(71, 98, 130, 0.2)" } : { bgcolor: null },
                    open ? { pb: 2 } : { pb: 0 },
                  ]}
                >
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => setOpen(!open)}
                    sx={[
                      { pb: 3, pt: 2.5 },
                      open ? { pb: 0 } : { pb: 2.5 },
                      open
                        ? { "&:hover, &:focus": { "& svg": { opacity: 1 } } }
                        : { "&:hover, &:focus": { "& svg": { opacity: 0 } } },
                    ]}
                  >
                    <ListItemText
                      primary="Project"
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: 15,
                            fontWeight: "medium",
                            lineHeight: "20px",
                            mb: "2px",
                          },
                        },
                        secondary: {
                          noWrap: true,
                          sx: {
                            fontSize: 12,
                            lineHeight: "16px",
                            color: open ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.5)",
                          },
                        },
                      }}
                      secondary="Decks & Timelines"
                      sx={{ my: 0 }}
                    />
                    <KeyboardArrowDown
                      sx={[
                        { mr: -1, opacity: 0, transition: "0.2s" },
                        open ? { transform: "rotate(-180deg)" } : { transform: "rotate(0)" },
                      ]}
                    />
                  </ListItemButton>
                  {userData && open && (
                    <SimpleTreeView>
                      <Decks />
                      <Timelines />
                    </SimpleTreeView>
                  )}
                </Box>
              </FireNav>
            )}
          </Paper>
          {/* メインコンテンツエリア */}
          <Box
            component="main"
            sx={{
              overflowY: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

const queryClient = new QueryClient();

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

  const [prevPrefersDarkMode, setPrevPrefersDarkMode] = useState(prefersDarkMode);
  if (prefersDarkMode !== prevPrefersDarkMode) {
    setPrevPrefersDarkMode(prefersDarkMode);
    if (!localStorage.getItem("paletteMode")) {
      setMode(prefersDarkMode ? "dark" : "light");
    }
  }

  useMount(() => {
    if (localStorage.getItem("paletteMode") === "dark") {
      setMode("dark");
    } else if (localStorage.getItem("paletteMode") === "light") {
      setMode("light");
    } else if (prefersDarkMode) {
      setMode("dark");
    } else {
      setMode("light");
    }
  });

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
        <QueryClientProvider client={queryClient}>
          <Provider store={defaultStore}>
            <CssBaseline />
            <LayoutMain userData={userData}>{children}</LayoutMain>
          </Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

const defaultStore = getDefaultStore();
