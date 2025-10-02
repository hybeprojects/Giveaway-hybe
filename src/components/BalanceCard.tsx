import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BalanceCard() {
  const [balance, setBalance] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const isWinner = balance > 0;

  return (
    <motion.div
      className="glassmorphic rounded-xl p-6 flex flex-col gap-4 shadow-lg border border-gold"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gold">Balance</span>
        <span className="text-2xl font-bold text-gold">
          <motion.span
            key={balance}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={isWinner ? 'glow-pulse' : ''}
          >
            ${balance.toLocaleString()}
          </motion.span>
        </span>
      </div>
      <button
        className={`w-full py-2 rounded bg-gold text-black font-bold transition-all ${isWinner ? '' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!isWinner}
        onClick={() => setShowWithdraw(true)}
      >
        Withdraw
      </button>
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg"
          >
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gold glassmorphic">
              <h2 className="text-lg font-bold text-gold mb-4">Withdraw Funds</h2>
              <div className="flex flex-col gap-3">
                <button className="w-full py-2 rounded bg-gold text-black font-semibold mb-2">Withdraw Crypto</button>
                <button className="w-full py-2 rounded bg-silver text-black font-semibold">Convert to Fiat</button>
                <div className="mt-4 text-xs text-gray-400">Secure withdrawal flow (OTP/2FA placeholder)</div>
              </div>
              <button className="mt-6 w-full py-2 rounded bg-gray-700 text-gold font-bold" onClick={() => setShowWithdraw(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
