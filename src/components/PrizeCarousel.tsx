import React from 'react';
import { motion } from 'framer-motion';

const prizes = [
  {
    name: 'Tesla Model 3',
    image: '/public/tesla-model-3.png', // Placeholder
    description: 'Win a Tesla Model 3! 3D preview coming soon.',
  },
  {
    name: '$700,000 Crypto',
    image: '/public/crypto-prize.png', // Placeholder
    description: 'Crypto prize with live ticker.',
  },
  {
    name: 'VIP HYBE Experience',
    image: '/public/vip-experience.png', // Placeholder
    description: 'Exclusive VIP experience card.',
  },
];

export default function PrizeCarousel() {
  return (
    <div className="w-full overflow-x-auto flex gap-4 py-2">
      {prizes.map((prize, idx) => (
        <motion.div
          key={prize.name}
          className="min-w-[250px] glassmorphic rounded-xl p-4 shadow-lg border border-gold flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:rotate-1 transition-transform"
          whileHover={{ scale: 1.07, rotate: 2 }}
        >
          <img src={prize.image} alt={prize.name} className="h-24 mb-2 object-contain" />
          <span className="font-bold text-gold text-lg mb-1">{prize.name}</span>
          <span className="text-xs text-gray-300 text-center">{prize.description}</span>
        </motion.div>
      ))}
    </div>
  );
}
