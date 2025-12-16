"use client";

import { Provider, getDefaultStore } from "jotai";
import Footer from "@/components/Footer";
import { Add, DarkMode, LightMode, PermMedia, UnfoldMore, ViewTimeline } from "@mui/icons-material";
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
} from "@mui/material";
import { createTheme, styled, useTheme } from "@mui/material/styles";
import { SxProps, ThemeProvider, useMediaQuery } from "@mui/system";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
  useOptimistic,
  useCallback,
  Key,
  MouseEvent,
  ElementType,
} from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { match } from "ts-pattern";
import { darkTheme, lightTheme } from "@/theme/theme";
import Link from "@/components/link";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { mainListItems, userListItems } from "@/components/home/listItems";
import User from "@/components/clerk/User";
import { getUserData } from "@/database";
import Paper from "@mui/material/Paper";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

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
      sx={{
        ...sx,
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
      }}
    >
      {children}
    </Box>
  );
};

const IconSelectWithAction = <T,>({
  options,
  selectorAction,
  action,
  onCreateAction,
}: {
  options: T[];
  selectorAction: (value: T) => Key;
  action: (value: T) => void;
  onCreateAction?: (value: T) => void;
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
  };

  const items = options.map(selectorAction).map((option, index) => (
    <MenuItem
      key={option}
      selected={index === selectedIndex}
      onClick={() => handleOptionClick(index)}
    >
      {option}
    </MenuItem>
  ));

  return (
    <>
      <Tooltip title={`選択中: ${options[selectedIndex]}`}>
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
        {onCreateAction
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

export type UserData = Awaited<ReturnType<typeof getUserData>>;
export type Legion = UserData["legions"][number];
export type User = UserData["user"];

const data = [
  { icon: <PermMedia />, label: "Decks" },
  { icon: <ViewTimeline />, label: "Timelines" },
];

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
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const [legion, setLegion] = useState<Legion | undefined>(userData?.legions[0]);
  const [member, setMember] = useState<User | undefined>(userData?.user);

  const [optimisticLegion, addOptimistic] = useOptimistic(
    legion,
    (_, optimisticValue: Legion) => optimisticValue, // 単純な置換の例
  );

  const action = useCallback(
    async (newL: Legion) => {
      addOptimistic(newL);
      setLegion(newL);
    },
    [addOptimistic],
  );

  const onLegionCreate = useCallback(
    async (newL: Legion) => {
      // 1. 即座にUIを書き換える
      addOptimistic(newL);
      setLegion(newL);
      // 2. Server Actionを実行（DB更新）
    },
    [addOptimistic],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", width: "100vw" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <AppBar position="absolute" sx={{ gridArea: "header" }}>
          <Toolbar
            sx={{ gap: 1, px: 2, display: "flex", alignItems: "center" }}
            component="nav"
            disableGutters={true}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
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
              {userData && member && (
                <>
                  <AfterSlash sx={{ ml: 2 }}>
                    <Typography variant="h6" component="div">
                      {optimisticLegion?.name || "No Legion"}
                    </Typography>
                    <IconSelectWithAction
                      options={userData.legions}
                      selectorAction={(legion) => legion.name}
                      action={action}
                      onCreateAction={onLegionCreate}
                    />
                  </AfterSlash>
                  <Typography variant="h6" component="div" sx={{ ml: 2 }}>
                    {member.name}
                  </Typography>
                  {legion?.members && (
                    <IconSelectWithAction
                      options={legion?.members}
                      selectorAction={(member) => member.name}
                      action={(member) => setMember({ id: member.userId, name: member.name })}
                    />
                  )}
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
        <Box
          sx={{
            flexGrow: 1, // AppBar 以外の高さを全部使う
            display: "grid",
            gridTemplateColumns: "250px minmax(0, 1fr)", // ここで横分割
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
                    { px: 3, pt: 2.5 },
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
                        fontSize: 15,
                        fontWeight: "medium",
                        lineHeight: "20px",
                        mb: "2px",
                      },
                      secondary: {
                        noWrap: true,
                        fontSize: 12,
                        lineHeight: "16px",
                        color: open ? "rgba(0,0,0,0)" : "rgba(255,255,255,0.5)",
                      },
                    }}
                    secondary="Authentication, Firestore Database, Realtime Database, Storage, Hosting, Functions, and Machine Learning"
                    sx={{ my: 0 }}
                  />
                  <KeyboardArrowDown
                    sx={[
                      { mr: -1, opacity: 0, transition: "0.2s" },
                      open ? { transform: "rotate(-180deg)" } : { transform: "rotate(0)" },
                    ]}
                  />
                </ListItemButton>
                {open &&
                  data.map((item) => (
                    <ListItemButton
                      key={item.label}
                      sx={{ py: 0, minHeight: 32, color: "rgba(255,255,255,.8)" }}
                    >
                      <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { fontSize: 14, fontWeight: "medium" } }}
                      />
                    </ListItemButton>
                  ))}
              </Box>
            </FireNav>
          </Paper>
          {/* メインコンテンツエリア */}
          <Box
            component="main"
            sx={{
              overflowY: "auto",
              p: 2,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
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
