import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const TESLA_IMG = 'https://cdn.builder.io/api/v1/image/assets%2F8904b50318464556900ddd5c6ecdfea6%2F127c63234f3742a7abb7557c9c266e86?format=webp&width=800';

export default function PrizeCarousel() {
  return (
    <Grid container spacing={2}>
      <Grid component="div" item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <img src={TESLA_IMG} alt="Tesla Model 3" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', borderRadius: 8 }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="overline" color="primary">GRAND PRIZE</Typography>
              <Typography variant="h6" color="white" sx={{ mt: 1 }}>TESLA MODEL 3</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(255,215,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Typography color="primary">₿</Typography>
            </Box>
            <Typography variant="h6" color="white">$700,000</Typography>
            <Typography variant="body2" color="textSecondary">IN CRYPTO</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>THIRD PRIZE</Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="h6" color="white">VIP HYBE Experience</Typography>
            <Typography variant="body2" color="textSecondary">Private jet, 5-star hotel, backstage access</Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
