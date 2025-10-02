import AppLayout from '../components/AppLayout';
import BalanceCard from '../components/BalanceCard';
import PrizeCarousel from '../components/PrizeCarousel';
import TransactionList from '../components/TransactionList';
import ActivityFeed from '../components/ActivityFeed';
import EntryTable from '../components/EntryTable';
import Leaderboard from '../components/Leaderboard';
import Prize3DCard from '../components/Prize3DCard';

// Placeholder imports for WithdrawModal, etc. Add as needed.

export default function DevDashboard() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto">
        <BalanceCard />
        <Prize3DCard />
        <PrizeCarousel />
        <TransactionList />
        <ActivityFeed />
        <EntryTable />
        <Leaderboard />
      </div>
    </AppLayout>
  );
}
