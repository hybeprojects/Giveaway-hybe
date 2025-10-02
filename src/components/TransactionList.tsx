import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const items = [
  { id: 1, type: 'Win', method: 'Crypto', amount: 700000, date: 'Oct 02, 2024 14:32' },
];

export default function TransactionList() {
  return (
    <List>
      {items.map((it) => (
        <ListItem key={it.id} sx={{ bgcolor: '#0b0b0b', mb: 1, borderRadius: 2 }}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'rgba(255,215,0,0.12)', color: 'primary.main' }}>✓</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="subtitle1" color="white">{it.type}</Typography>}
            secondary={<>
              <Typography variant="body2" color="textSecondary">{it.method}</Typography>
              <Typography variant="caption" display="block" color="textSecondary">{it.date}</Typography>
            </>}
          />
          <Typography variant="h6" color="primary">+ ${it.amount.toLocaleString()}</Typography>
        </ListItem>
      ))}
    </List>
  );
}
