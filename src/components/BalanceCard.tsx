import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function BalanceCard() {
  const balance = 0;
  const isWinner = balance > 0;

  return (
    <Card sx={{ bgcolor: '#0f0f10', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="subtitle1" color="textSecondary">Balance</Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>{`$${balance.toLocaleString()}`}</Typography>
          </div>
          <Button variant="contained" color="primary" disabled={!isWinner} sx={{ borderRadius: 3, px: 3, py: 1.2, textTransform: 'none' }}>
            Withdraw
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
