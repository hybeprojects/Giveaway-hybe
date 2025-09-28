import { useEffect, useMemo, useState } from 'react';
import { getMe, clearLocalSession, LedgerEntry, UserEntry } from '../utils/auth';
import { useToast } from '../components/Toast';

function calculateBalances(ledger: LedgerEntry[]) {
  const pending = ledger.filter(i => i.type === 'credit' && i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const availableCredits = ledger.filter(i => i.type === 'credit' && i.status === 'available').reduce((s, i) => s + i.amount, 0);
  const debits = ledger.filter(i => i.type === 'debit').reduce((s, i) => s + i.amount, 0);
  const available = Math.max(0, availableCredits - debits);
  return { pending, available };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const toast = useToast();

  const bal = useMemo(() => calculateBalances(ledger), [ledger]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await getMe();
        if (res.ok) {
          setEntry(res.entry);
          setLedger(res.ledger);
        } else {
          // If fetching fails (e.g., expired token), log out the user.
          clearLocalSession();
          window.location.href = '/login';
          setError(res.error);
        }
      } catch (e: any) {
        setError(e?.message || 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const withdraw = async () => {
    const amount = prompt('Enter amount to withdraw (available: ' + bal.available.toFixed(2) + '):');
    if (!amount) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { toast.error('Invalid amount'); return; }
    if (n > bal.available) { toast.error('Insufficient balance.'); return; }

    try {
      const { apiBase } = await import('../utils/auth');
      const sessionToken = localStorage.getItem('local_session') || '';
      await fetch(`${apiBase}/activity-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ email: entry?.email, type: 'withdrawal', detail: `Withdrawal requested: ${n.toFixed(2)} points`, amount: n })
      });
      toast.success('Withdrawal requested');
      // Refresh data from server instead of reloading the page
      const res = await getMe();
      if (res.ok) setLedger(res.ledger);
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed.');
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

        <div className="two-col-grid">
          <div className="card card-pad">
            <h3>Balance</h3>
            <div className="h1 mt-8">{bal.available.toFixed(2)} <span className="subtle" style={{ fontSize: 14 }}>points</span></div>
            <div className="subtle mt-6">Pending: {bal.pending.toFixed(2)} points</div>
            <div className="button-row mt-12">
              <button className="button-primary" onClick={withdraw} disabled={bal.available <= 0}>Withdraw</button>
            </div>
          </div>
          <div className="card card-pad">
            <h3>Recent activity</h3>
            <ul>
              {ledger.length === 0 && <li className="subtle">No transactions yet</li>}
              {ledger.map(l => (
                <li key={l.id} className="subtle">
                  {l.type === 'credit' ? '+' : '-'}{l.amount.toFixed(2)} {l.currency} — {l.note} <span className="dim">({new Date(l.created_at).toLocaleString()}{l.status ? ` · ${l.status}` : ''})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}