import React from 'react';
import AppLayout from '../components/AppLayout';
import BalanceCard from '../components/BalanceCard';
import PrizeCarousel from '../components/PrizeCarousel';
import TransactionList from '../components/TransactionList';
import ActivityFeed from '../components/ActivityFeed';
import EntryTable from '../components/EntryTable';
import Leaderboard from '../components/Leaderboard';
import Prize3DCard from '../components/Prize3DCard';

// MUI imports
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

export default function DevDashboard() {
  return (
    <AppLayout>
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h5" color="white" fontWeight={600}>Dashboard — HYBE Giveaway</Typography>
            <Typography variant="body2" color="gray">Overview of entries, activity, balances, and prizes.</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              variant="filled"
              placeholder="Search entries, users, emails..."
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 1, input: { color: 'white' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'gray' }} />
                  </InputAdornment>
                ),
              }}
            />
            <IconButton color="inherit" sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <FilterListIcon />
            </IconButton>
            <Button variant="contained" sx={{ bgcolor: 'gold', color: 'black', '&:hover': { bgcolor: '#f3c000' } }}>Create Promo</Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <BalanceCard />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Prize3DCard />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="h6" color="white" mb={1}>Prize Showcase</Typography>
                  <PrizeCarousel />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="h6" color="white" mb={1}>Recent Transactions</Typography>
                  <TransactionList />
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="subtitle1" color="white" mb={1}>Live Activity</Typography>
                  <ActivityFeed />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <Typography variant="subtitle1" color="white" mb={1}>Leaderboard</Typography>
                  <Leaderboard />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.04)', maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="subtitle1" color="white" mb={1}>My Entries</Typography>
                  <EntryTable />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box mt={4} color="gray">
          Last updated: {new Date().toLocaleString()}
        </Box>
      </Container>
    </AppLayout>
  );
}
