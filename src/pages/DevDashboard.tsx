import AppLayout from '../components/AppLayout';
import React from 'react';
import AppLayout from '../components/AppLayout';
import BalanceCard from '../components/BalanceCard';
import PrizeCarousel from '../components/PrizeCarousel';
import TransactionList from '../components/TransactionList';
import ActivityFeed from '../components/ActivityFeed';
import EntryTable from '../components/EntryTable';
import Leaderboard from '../components/Leaderboard';
import Prize3DCard from '../components/Prize3DCard';
import { FiSearch, FiFilter } from 'react-icons/fi';

export default function DevDashboard() {
  return (
    <AppLayout>
      <main className="p-6 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard — HYBE Giveaway</h1>
            <p className="text-sm text-gray-300">Overview of entries, activity, balances, and prizes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                aria-label="Search"
                placeholder="Search entries, users, emails..."
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-sm text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 hover:bg-gray-700">
              <FiFilter /> Filters
            </button>
            <button className="px-4 py-2 rounded-lg bg-gold text-black font-semibold">Create Promo</button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
                <BalanceCard />
              </div>
              <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
                <Prize3DCard />
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Prize Showcase</h2>
              <PrizeCarousel />
            </div>

            <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Recent Transactions</h2>
              <TransactionList />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
              <h3 className="text-base font-semibold text-white mb-3">Live Activity</h3>
              <ActivityFeed />
            </div>

            <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800">
              <h3 className="text-base font-semibold text-white mb-3">Leaderboard</h3>
              <Leaderboard />
            </div>

            <div className="bg-gray-900 rounded-xl p-4 shadow-md border border-gray-800 overflow-auto max-h-72">
              <h3 className="text-base font-semibold text-white mb-3">My Entries</h3>
              <EntryTable />
            </div>
          </aside>
        </section>

        <footer className="mt-8 text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</footer>
      </main>
    </AppLayout>
  );
}
