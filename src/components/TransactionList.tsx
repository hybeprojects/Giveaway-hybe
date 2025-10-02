import React from 'react';

const transactions = [
  { type: 'Win', amount: 700000, date: '2025-10-01', status: 'Completed' },
  { type: 'Withdrawal', amount: 700000, date: '2025-10-02', status: 'Pending' },
  { type: 'Conversion', amount: 50000, date: '2025-09-30', status: 'Completed' },
];

export default function TransactionList() {
  return (
    <div className="glassmorphic rounded-xl p-4 shadow-lg border border-gold">
      <h2 className="text-lg font-bold text-gold mb-2">Transactions</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gold">
            <th className="text-left">Type</th>
            <th className="text-right">Amount</th>
            <th className="text-right">Date</th>
            <th className="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <tr key={idx} className="border-b border-gray-800">
              <td>{tx.type}</td>
              <td className="text-right">${tx.amount.toLocaleString()}</td>
              <td className="text-right">{tx.date}</td>
              <td className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.status === 'Completed' ? 'bg-gold text-black' : 'bg-gray-700 text-gold'}`}>{tx.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
