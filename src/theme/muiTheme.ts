import { createTheme } from '@mui/material/styles';

const gold = '#FFD700';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: gold, contrastText: '#000' },
    background: {
      default: '#0b0b0b',
      paper: '#0f0f10',
    },
    text: { primary: '#fff', secondary: 'rgba(255,255,255,0.7)' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
        },
        containedPrimary: {
          backgroundColor: gold,
          color: '#000',
          '&:hover': { backgroundColor: '#f3c000' },
        },
      },
    },
  },
});

export default theme;
