import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const feed = [
  { id: 1, text: 'Kim entered Tesla Model 3 Giveaway', time: '5m ago' },
  { id: 2, text: 'Park won $700,000 in Crypto', time: '1h ago' },
];

export default function ActivityFeed() {
  return (
    <List>
      {feed.map((f) => (
        <ListItem key={f.id} sx={{ bgcolor: '#0b0b0b', mb: 1, borderRadius: 2 }}>
          <ListItemText primary={<Typography color="white">{f.text}</Typography>} secondary={<Typography variant="caption" color="textSecondary">{f.time}</Typography>} />
        </ListItem>
      ))}
    </List>
  );
}
