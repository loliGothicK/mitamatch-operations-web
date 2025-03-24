import type { ThemeOptions } from '@mui/material/styles';

export const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: '#fff',
      paper: 'rgba(247, 200, 218)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    action: {
      active: '#b5c97c',
      hover: 'rgba(181, 201, 124, 0.08)',
      selected: 'rgba(181, 201, 124, 0.16)',
      disabled: 'rgba(181, 201, 124, 0.3)',
      disabledBackground: 'rgba(181, 201, 124, 0.12)',
    },
    primary: {
      main: '#f7c8da',
      light: '#fbe5eb',
      dark: '#f4b3ca',
    },
    secondary: {
      main: '#b5c97c',
      light: '#8fa34b',
      dark: '#e7f5c4',
    },
    success: {
      main: '#4caf50',
      light: '#077d55',
      dark: '#16a766',
    },
    error: {
      main: '#f44336',
      light: '#d91f11',
      dark: '#fa5343',
    },
  },
};

export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    text: {
      primary: '#fbe5eb',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(155, 155, 155)',
    },
    action: {
      active: '#f4b3ca',
      hover: 'rgba(244, 179, 202, 0.08)',
      selected: 'rgba(244, 179, 202, 0.16)',
      disabled: 'rgba(244, 179, 202, 0.3)',
      disabledBackground: 'rgba(244, 179, 202, 0.12)',
    },
    background: {
      default: '#121212',
      paper: 'rgba(50, 50, 50)',
    },
    primary: {
      main: '#8b4b5e', // ピンクの深い色調
      light: '#b36677', // やや明るいダークピンク
      dark: '#5c3240', // より深い濃い色
    },
    secondary: {
      main: '#5c7a3e', // 緑の深い色調
      light: '#4a6332', // より暗い緑
      dark: '#6e8f4a', // やや明るい深緑
    },
    success: {
      main: '#4caf50',
      light: '#077d55',
      dark: '#16a766',
    },
    error: {
      main: '#f44336',
      light: '#d91f11',
      dark: '#fa5343',
    },
  },
};
