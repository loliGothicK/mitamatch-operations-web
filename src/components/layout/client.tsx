"use client";

import { Provider, getDefaultStore } from "jotai";
import Footer from "@/components/Footer";
import { Add, DarkMode, KeyboardArrowDown, LightMode, UnfoldMore } from "@mui/icons-material";
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
  Tooltip,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { createTheme, styled, useTheme } from "@mui/material/styles";
import { SxProps, ThemeProvider, useMediaQuery } from "@mui/system";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  PropsWithChildren,
  useOptimistic,
  useCallback,
  Key,
  MouseEvent,
  ElementType,
} from "react";
import { redirect, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { match } from "ts-pattern";
import { darkTheme, lightTheme } from "@/theme/theme";
import Link from "@/components/link";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { mainListItems, userListItems } from "@/components/home/listItems";
import { default as ClerkUser } from "@/components/clerk/User";
import Paper from "@mui/material/Paper";
import { createLegionAction } from "@/_actions/legion";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Decks } from "@/components/project/Decks";
import { SimpleTreeView } from "@mui/x-tree-view";
import { Timelines } from "@/components/project/Timelines";
import type { UserData, Legion } from "@/types/user";
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

const AfterSlash = ({ sx, children }: PropsWithChildren<{ sx?: SxProps }>) => {
  return (
    <Box
      sx={[
        {
          mr: 2,
          position: "relative",
          color: "parimary.main",
          height: "100%",
          display: "flex",
          alignItems: "center",
          // ここが重要：擬似要素で斜め部分を作る
          "&::after": {
            content: '""',
            position: "absolute",
            right: -20, // 角度に合わせて調整
            width: 2, // 斜め部分の幅
            height: "50%",
            background: (theme) => theme.palette.secondary.main,
            transform: "skewX(-20deg)", // 斜めにする角度
            transformOrigin: "top",
            zIndex: -1, // テキストの後ろへ
          },
          // Box自体は四角形なので、右側のはみ出しを制御するために必要ならz-index調整
          zIndex: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
};

const IconSelectWithAction = <T,>({
  options,
  selectorAction,
  action,
  onRequestCreate,
}: {
  options: T[];
  selectorAction: (value: T) => Key;
  action: (value: T) => void;
  onRequestCreate?: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionClick = (index: number) => {
    setSelectedIndex(index);
    action(options[index]);
    handleClose();
  };

  const handleCreateNew = () => {
    handleClose();
    if (onRequestCreate) {
      onRequestCreate();
    }
  };

  const items = options.map(selectorAction).map((option, index) => (
    <MenuItem
      key={option}
      selected={index === selectedIndex}
      onClick={() => handleOptionClick(index)}
    >
      <Typography>{option as string}</Typography>
    </MenuItem>
  ));

  return (
    <>
      <Tooltip title={`選択中: ${String(options[selectedIndex])}`}>
        <IconButton onClick={handleClick} size="small">
          <UnfoldMore />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        // リストが長くなった際のスクロール設定（重要）
        slotProps={{
          paper: {
            style: {
              maxHeight: 300,
              width: "20ch",
            },
          },
        }}
      >
        {/* 新規作成アクション */}
        {/* 重要: 選択状態(selected)を持たせない */}
        {onRequestCreate
          ? [
              ...items,
              <Divider key={"divider"} sx={{ my: 0.5 }} />,
              <MenuItem key={"create new"} onClick={handleCreateNew} sx={{ color: "primary.main" }}>
                <ListItemIcon>
                  <Add fontSize="small" color="primary" />
                </ListItemIcon>
                <Typography variant="inherit">新規作成</Typography>
              </MenuItem>,
            ]
          : items}
      </Menu>
    </>
  );
};

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
  const theme = useTheme();
  const [legion, setLegion] = useState<Legion | undefined>(userData?.legions[0]);

  const [optimisticLegion, addOptimistic] = useOptimistic(
    legion,
    (_, optimisticValue: Legion) => optimisticValue, // 単純な置換の例
  );

  useEffect(() => {
    setLegion(userData?.legions[0]);
  }, [userData]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLegionName, setNewLegionName] = useState("");
  const router = useRouter();

  const action = useCallback(
    async (newL: Legion) => {
      startTransition(() => {
        addOptimistic(newL);
      });
      setLegion(newL);
    },
    [addOptimistic],
  );

  const onLegionCreateSubmit = async () => {
    if (!newLegionName) return;
    try {
      await createLegionAction(newLegionName);
      setCreateDialogOpen(false);
      setNewLegionName("");
      router.refresh();
    } catch (e) {
      console.error("Failed to create legion", e);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "calc(100vw - 15px)",
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
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {userData ? (
                <>
                  <AfterSlash>
                    <Link href="/" sx={{ pr: 2 }}>
                      <Image
                        src="/MitamaLabLogo.png"
                        alt="logo"
                        width={40}
                        height={40}
                        priority={true}
                      />
                    </Link>
                  </AfterSlash>
                  <AfterSlash sx={{ ml: 2, display: "flex", alignItems: "center" }}>
                    <Typography variant="h6" component="div">
                      {optimisticLegion?.name || "No Legion"}
                    </Typography>
                    <IconSelectWithAction
                      options={userData.legions}
                      selectorAction={(legion) => legion.name}
                      action={action}
                      onRequestCreate={() => setCreateDialogOpen(true)}
                    />
                  </AfterSlash>
                  <Typography variant="h6" component="div" sx={{ ml: 2 }}>
                    {userData.user.name}
                  </Typography>
                </>
              ) : (
                <>
                  <Link href="/" sx={{ pr: 2 }}>
                    <Image
                      src="/MitamaLabLogo.png"
                      alt="logo"
                      width={40}
                      height={40}
                      priority={true}
                    />
                  </Link>
                  <Typography variant="h6" component="div">
                    {"Mitamatch Operations"}
                  </Typography>
                </>
              )}
            </Box>
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
            <Box sx={{ flexGrow: 0.5 }} />
            <Divider orientation="vertical" flexItem />
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
            gridTemplateColumns:
              userData && pathname.endsWith("builder")
                ? "210px minmax(0, 1fr)"
                : "54px minmax(0, 1fr)", // ここで横分割
            overflow: "hidden", // 内部スクロールのために必要
          }}
        >
          {/* サイドバー */}
          <Paper
            elevation={0}
            sx={{
              display: "flex",
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
              <FireNav component="nav" disablePadding>
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

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>レギオン（組織）の新規作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="レギオン名"
            type="text"
            fullWidth
            variant="outlined"
            value={newLegionName}
            onChange={(e) => setNewLegionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button onClick={onLegionCreateSubmit} disabled={!newLegionName} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>
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
