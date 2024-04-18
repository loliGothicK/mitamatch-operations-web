import Footer from '@/components/Footer';
import { mainListItems } from '@/components/home/listItems';
import { themeOptions } from '@/theme/theme';
import { DarkMode, LightMode } from '@mui/icons-material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
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
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position='absolute' open={open}>
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
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
            <MenuIcon />
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
          <Link
            href='https://github.com/sponsors/loliGothicK?o=esb'
            aria-label='Sponsor @loliGothicK'
            target='_blank'
          >
            <span
              className='Button-content'
              style={{
                alignItems: 'center',
                display: 'grid',
                flex: '1 0 auto',
                gridTemplateAreas: '"leadingVisual text trailingVisual"',
                gridTemplateColumns: 'min-content minmax(0, auto) min-content',
                placeContent: 'center',
              }}
            >
              <span
                style={{ marginRight: '0.5rem', gridArea: 'leadingVisual' }}
              >
                <svg
                  fill={theme.palette.secondary[theme.palette.mode]}
                  aria-hidden='true'
                  height='16'
                  viewBox='0 0 16 16'
                  version='1.1'
                  width='16'
                  data-view-component='true'
                  style={{
                    gridArea: 'text',
                    display: 'flex',
                  }}
                >
                  <path d='m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z' />
                </svg>
              </span>
              <span
                className='Button-label'
                style={{
                  color: theme.palette.secondary[theme.palette.mode],
                }}
              >
                Sponsor
              </span>
            </span>
          </Link>
          <IconButton
            sx={{ ml: 1 }}
            onClick={colorMode.toggleColorMode}
            color='inherit'
          >
            {theme.palette.mode === 'dark' ? <DarkMode /> : <LightMode />}
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
            <ChevronLeftIcon />
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
