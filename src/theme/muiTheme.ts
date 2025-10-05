import { createTheme } from '@mui/material/styles';

const gold = '#FFD700';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: gold, contrastText: '#000' },
    secondary: { main: '#0a84ff' },
    background: {
      default: '#0b0b0b',
      paper: '#0f0f10',
    },
    text: { primary: '#fff', secondary: 'rgba(255,255,255,0.72)' },
    divider: 'rgba(255,255,255,0.08)'
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    button: { fontWeight: 700, letterSpacing: 0.4, textTransform: 'none' },
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 800, letterSpacing: -0.3 },
  },
  shadows: [
    'none',
    '0 4px 20px rgba(0,0,0,0.25)',
    ...Array(23).fill('0 8px 30px rgba(0,0,0,0.35)')
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b0b0b',
          color: '#fff'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.06)'
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          outline: 'none',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          '&:focus-visible': { boxShadow: '0 0 0 3px rgba(10,132,255,0.25)' }
        },
        containedPrimary: {
          backgroundColor: gold,
          color: '#000',
          '&:hover': { backgroundColor: '#f3c000' }
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.4)'
        }
      },
    },
  },
});

export default theme;
