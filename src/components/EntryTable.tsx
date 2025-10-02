import React from 'react';

const entries = [
  { giveaway: 'Tesla Model 3', status: 'Active' },
  { giveaway: '$700,000 Crypto', status: 'Pending Draw' },
  { giveaway: 'VIP HYBE Experience', status: 'Lost' },
];

export default function EntryTable() {
  return (
    <div className="glassmorphic rounded-xl p-4 shadow-lg border border-gold">
      <h2 className="text-lg font-bold text-gold mb-2">My Entries</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gold">
            <th className="text-left">Giveaway</th>
            <th className="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b border-gray-800">
              <td>{entry.giveaway}</td>
              <td className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${entry.status === 'Active' ? 'bg-gold text-black' : entry.status === 'Pending Draw' ? 'bg-silver text-black' : 'bg-gray-700 text-gold'}`}>{entry.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
