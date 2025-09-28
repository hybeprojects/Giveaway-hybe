import { useEffect, useMemo, useState } from 'react';
import { getMe, clearLocalSession, LedgerEntry, UserEntry } from '../utils/auth';
import { useToast } from '../components/Toast';
import WinnerWelcomeModal from '../components/WinnerWelcomeModal';
import PrizeRoadmap from '../components/PrizeRoadmap';

// --- Helper Functions (omitted for brevity, no changes) ---
function groupLedgerByDate(ledger: LedgerEntry[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  const getDayString = (date: Date) => {
    if (date.toDateString() === todayStr) return 'Today';
    if (date.toDateString() === yesterdayStr) return 'Yesterday';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  return ledger.reduce((acc, entry) => {
    const day = getDayString(new Date(entry.created_at));
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, LedgerEntry[]>);
}
function getTransactionIcon(note: string | null) {
  const lowerNote = note?.toLowerCase() || '';
  if (lowerNote.includes('welcome')) return '🎉';
  if (lowerNote.includes('withdrawal')) return '💸';
  if (lowerNote.includes('share')) return '🔗';
  if (lowerNote.includes('follow')) return '❤️';
  return '💰';
}
function calculateBalances(ledger: LedgerEntry[]) {
  const pending = ledger.filter(i => i.type === 'credit' && i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const availableCredits = ledger.filter(i => i.type === 'credit' && i.status === 'available').reduce((s, i) => s + i.amount, 0);
  const debits = ledger.filter(i => i.type === 'debit').reduce((s, i) => s + i.amount, 0);
  const available = Math.max(0, availableCredits - debits);
  return { pending, available };
}

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isWinnerModalOpen, setWinnerModalOpen] = useState(false);
  const toast = useToast();

  const bal = useMemo(() => calculateBalances(ledger), [ledger]);
  const groupedLedger = useMemo(() => groupLedgerByDate(ledger), [ledger]);

  const fetchDashboardData = async () => {
    try {
      const res = await getMe();
      if (res.ok) {
        setEntry(res.entry);
        setLedger(res.ledger);
        return res.entry;
      } else {
        clearLocalSession();
        window.location.href = '/login';
        setError(res.error);
        return null;
      }
    } catch (e: any) {
      setError(e?.message || 'An unknown error occurred.');
      return null;
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      const userEntry = await fetchDashboardData();
      if (userEntry?.is_winner && sessionStorage.getItem('winnerModalShown') !== 'true') {
        setWinnerModalOpen(true);
        sessionStorage.setItem('winnerModalShown', 'true');
      }
      setLoading(false);
    };
    initialLoad();
  }, []);

  const withdraw = async () => {
    // ... (omitting for brevity, no changes here)
    const amount = prompt('Enter amount to withdraw (available: ' + bal.available.toFixed(2) + '):');
    if (!amount) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error('Invalid amount'); return; }
    if (n > bal.available) { toast.error('Insufficient balance.'); return; }
    const optimisticEntry: LedgerEntry = { id: crypto.randomUUID(), type: 'debit', amount: n, currency: 'points', note: 'Withdrawal request (pending)', created_at: new Date().toISOString(), status: 'pending' };
    setLedger(prevLedger => [optimisticEntry, ...prevLedger]);
    try {
      const sessionToken = localStorage.getItem('local_session') || '';
      const res = await fetch(`/.netlify/functions/activity-handler`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ email: entry?.email, type: 'withdrawal', detail: `Withdrawal requested: ${n.toFixed(2)} points`, amount: n }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed on the server.');
      toast.success('Withdrawal request successful');
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed.');
      setLedger(prevLedger => prevLedger.filter(item => item.id !== optimisticEntry.id));
    } finally {
      fetchDashboardData();
    }
  };

  if (loading) return (
    <section className="section" aria-label="Dashboard Loading">
      <div className="container"><div className="card card-pad">Loading dashboard…</div></div>
    </section>
  );

  if (error) return (
    <section className="section" aria-label="Dashboard Error">
      <div className="container"><div className="card card-pad">Error: {error}</div></div>
    </section>
  );

  return (
    <section className="section" aria-label="Dashboard">
      <WinnerWelcomeModal
        isOpen={isWinnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        prizeDetails={entry?.prize_details || 'a fantastic prize!'}
      />
      <div className="container">
        <div className="card card-pad mb-16">
          <div className="row-between">
            <div>
              <h2 className="section-title m-0">Your Giveaway Dashboard</h2>
              <p className="subtle">Signed in as {entry?.email}</p>
            </div>
            <button className="button-secondary" onClick={() => {
              clearLocalSession();
              window.location.href = '/';
            }}>
              Sign out
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="card card-pad">
              <h3>Recent activity</h3>
              <div className="activity-feed">
                {Object.keys(groupedLedger).length === 0 && <p className="subtle">No transactions yet</p>}
                {Object.entries(groupedLedger).map(([day, entries]) => (
                  <div key={day}>
                    <p className="subtle text-bold mt-12 mb-8">{day}</p>
                    <ul className="activity-list">
                      {entries.map(l => (
                        <li key={l.id}>
                          <div className="activity-icon">{getTransactionIcon(l.note)}</div>
                          <div className="activity-details">
                            <p className="text-bold">{l.note}</p>
                            <p className="subtle">{l.type === 'credit' ? '+' : '-'}{l.amount.toFixed(2)} {l.currency}</p>
                          </div>
                          <StatusBadge status={l.status || 'available'} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dashboard-sidebar">
            <div className="card card-pad mb-16">
              <h3>Balance</h3>
              <div className="h1 mt-8">{bal.available.toFixed(2)} <span className="subtle" style={{ fontSize: 14 }}>points</span></div>
              <div className="subtle mt-6">Pending: {bal.pending.toFixed(2)} points</div>
              <div className="button-row mt-12">
                <button className="button-primary" onClick={withdraw} disabled={bal.available <= 0}>Withdraw</button>
              </div>
            </div>

            {entry?.is_winner ? (
              <PrizeRoadmap user={entry} onDataRefresh={fetchDashboardData} />
            ) : (
              <div className="card card-pad">
                <h3>Ways to Earn</h3>
                <ul className="ways-to-earn">
                  <li><a href="#">🔗 Share on X <span className="points">+50</span></a></li>
                  <li><a href="#">❤️ Follow on Instagram <span className="points">+50</span></a></li>
                  <li><a href="#">👍 Like on Facebook <span className="points">+50</span></a></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: 'var(--color-warn-light)', color: 'var(--color-warn-dark)' },
    available: { backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
    completed: { backgroundColor: 'var(--color-info-light)', color: 'var(--color-info-dark)' },
  };
  const style = styles[status] || styles.available;
  return <span className="status-badge" style={style}>{status}</span>;
}