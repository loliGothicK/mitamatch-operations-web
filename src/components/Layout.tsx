import Footer from '@/components/Footer';
import { mainListItems } from '@/components/home/listItems';
import { themeOptions } from '@/theme/theme';
import {
  DarkMode,
  LightMode,
  Person,
  ChevronLeft,
  Menu,
} from '@mui/icons-material';
import {
  AppBar as MuiAppBar,
  type AppBarProps as MuiAppBarProps,
  Box,
  Container,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  ThemeProvider,
  createTheme,
  styled,
  useTheme,
} from '@mui/material/styles';
import { useMediaQuery } from '@mui/system';
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { redirect } from 'next/navigation';
import { defaultSession, SessionData } from '@/session/sessionData';
import Image from 'next/image';
const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// biome-ignore lint/suspicious/noEmptyBlockStatements: Suspicious empty block
const ColorModeContext = createContext({ toggleColorMode: () => {} });

function BasicLayout({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData>(defaultSession);
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  useEffect(() => {
    (async () => {
      fetch('http://localhost:3000/api/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(session => {
          if (session.isLoggedIn) {
            setSession(session);
          }
        });
    })();
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position='absolute' open={open}>
        <Toolbar>
          <IconButton
            edge='start'
            color='inherit'
            aria-label='open drawer'
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <Menu />
          </IconButton>
          <Typography
            component='h1'
            variant='h6'
            color='inherit'
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Mitamatch Operations for Web
          </Typography>

          <IconButton
            sx={{ ml: 1 }}
            onClick={colorMode.toggleColorMode}
            color='inherit'
          >
            {theme.palette.mode === 'dark' ? <DarkMode /> : <LightMode />}
          </IconButton>
          <IconButton
            onClick={() => redirect('http://localhost:3000/api/auth/discord')}
          >
            {session.userId !== '' && session.avatar ? (
              <Image
                src={`https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png`}
                alt={'avatar'}
                width={20}
                height={20}
              />
            ) : (
              <Person sx={{ flexGrow: 0.05 }} width={20} height={20} />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant='permanent' open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeft />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component='nav'>{mainListItems}</List>
      </Drawer>
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          scrollPaddingTop: '100px',
        }}
      >
        <Toolbar />
        <Container sx={{ mt: 4, mb: 4, minHeight: '75vh', minWidth: '80vw' }}>
          {/* Main Contents */}
          {children}
        </Container>
        <Footer
          sx={{
            position: 'absolute',
            bottom: 0,
            width: '25vh',
          }}
        />
      </Box>
    </Box>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => {
          if (prevMode === 'light') {
            localStorage.setItem('paletteMode', 'dark');
            return 'dark';
          }
          localStorage.setItem('paletteMode', 'light');
          return 'light';
        });
      },
    }),
    [],
  );

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    if (localStorage.getItem('paletteMode') === 'dark') {
      setMode('dark');
    } else if (localStorage.getItem('paletteMode') === 'light') {
      setMode('light');
    } else if (prefersDarkMode) {
      setMode('dark');
    } else {
      setMode('light');
    }
  }, [prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode, ...themeOptions.palette },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <BasicLayout>{children}</BasicLayout>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
