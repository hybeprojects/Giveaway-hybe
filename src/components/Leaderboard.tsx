import React from 'react';

const leaderboard = [
  { name: 'Kim', entries: 120, region: 'Global', isUser: false },
  { name: 'Alex (You)', entries: 110, region: 'Global', isUser: true },
  { name: 'Sam', entries: 100, region: 'Global', isUser: false },
];

export default function Leaderboard() {
  return (
    <div className="glassmorphic rounded-xl p-4 shadow-lg border border-gold">
      <h2 className="text-lg font-bold text-gold mb-2">Leaderboard</h2>
      <div className="flex gap-2 mb-2">
        <button className="px-3 py-1 rounded bg-gold text-black font-semibold">Global</button>
        <button className="px-3 py-1 rounded bg-gray-700 text-gold font-semibold">Regional</button>
        <button className="px-3 py-1 rounded bg-gray-700 text-gold font-semibold">Friends</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gold">
            <th className="text-left">Name</th>
            <th className="text-right">Entries</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, idx) => (
            <tr key={idx} className={user.isUser ? 'bg-gold/20' : ''}>
              <td className={user.isUser ? 'font-bold text-gold' : ''}>{user.name}</td>
              <td className="text-right">{user.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
