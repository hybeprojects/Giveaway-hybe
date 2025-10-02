import React from 'react';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme/muiTheme';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 glassmorphic border-b border-gold">
          <div className="flex items-center gap-2">
            <img src="/hybe-logo.svg" alt="HYBE Logo" className="h-8" />
            <span className="font-bold text-gold text-lg">HYBE Giveaway</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Profile avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gold" />
            {/* Tier badge placeholder */}
            <span className="px-2 py-1 rounded bg-gold text-black text-xs font-semibold">VIP</span>
          </div>
        </header>
        {/* Main content */}
        <main className="pb-20">{children}</main>
        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-gold flex justify-around py-2 z-50">
          <button className="text-gold flex flex-col items-center"><span className="material-icons">dashboard</span><span className="text-xs">Dashboard</span></button>
          <button className="text-gold flex flex-col items-center"><span className="material-icons">card_giftcard</span><span className="text-xs">Prizes</span></button>
          <button className="text-gold flex flex-col items-center"><span className="material-icons">account_balance_wallet</span><span className="text-xs">Balance</span></button>
          <button className="text-gold flex flex-col items-center"><span className="material-icons">emoji_events</span><span className="text-xs">Rewards</span></button>
          <button className="text-gold flex flex-col items-center"><span className="material-icons">history</span><span className="text-xs">Activity</span></button>
        </nav>
      </div>
    </ThemeProvider>
  );
}
