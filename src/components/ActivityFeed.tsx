import React from 'react';
import { motion } from 'framer-motion';

const activities = [
  { message: 'Kim entered Tesla Model 3 Giveaway', time: '1m ago' },
  { message: 'Winner credited +$700,000', time: '5m ago' },
];

export default function ActivityFeed() {
  return (
    <div className="glassmorphic rounded-xl p-4 shadow-lg border border-gold">
      <h2 className="text-lg font-bold text-gold mb-2">Activity Feed</h2>
      <ul className="flex flex-col gap-2">
        {activities.map((act, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex justify-between items-center bg-black/30 rounded px-3 py-2"
          >
            <span>{act.message}</span>
            <span className="text-xs text-gold">{act.time}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
