import { useEffect, useMemo, useState } from 'react';
import { getSession, signOut, isSupabaseConfigured } from '../utils/supabaseClient';
import { balances, getLedger, addDebit } from '../utils/balance';
import { getLocalSession, clearLocalSession } from '../utils/auth';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const bal = useMemo(() => balances(), []);
  const ledger = useMemo(() => getLedger(), []);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured()) {
        const s = await getSession();
        if (!s) { window.location.href = '/login'; return; }
        setEmail(s.user.email || '');
      } else {
        const s = getLocalSession();
        if (!s) { window.location.href = '/login'; return; }
        setEmail(s.email);
      }
      setLoading(false);
    })();
  }, []);

  const withdraw = async () => {
    const amount = prompt('Enter amount to withdraw (available: ' + bal.available.toFixed(2) + '):');
    if (!amount) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > bal.available) { toast.error('Invalid amount'); return; }
    addDebit(n);
    try { const { apiBase } = await import('../utils/auth'); await fetch(`${apiBase}/activity-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'withdrawal', detail: `Withdrawal requested: $${n.toFixed(2)}` }) }); } catch {}
    toast.success('Withdrawal requested');
    window.location.reload();
  };

  const connectBank = async () => {
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        toast.info('Bank connection will be enabled after Stripe Connect is configured.');
      }
    } catch {
      toast.info('Bank connection will be enabled after Stripe Connect is configured.');
    }
  };

  if (loading) return (
    <section className="section" aria-label="Dashboard Loading">
      <div className="container"><div className="card card-pad">Loading…</div></div>
    </section>
  );

  return (
    <section className="section" aria-label="Dashboard">
      <div className="container">
        <div className="card card-pad mb-16">
          <div className="row-between">
            <div>
              <h2 className="section-title m-0">Your Giveaway Dashboard</h2>
              <p className="subtle">Signed in as {email}</p>
            </div>
            <button className="button-secondary" onClick={() => {
              if (isSupabaseConfigured()) signOut(); else clearLocalSession();
              window.location.href = '/';
            }}>
              Sign out
            </button>
          </div>
        </div>

        <div className="two-col-grid">
          <div className="card card-pad">
            <h3>Balance</h3>
            <div className="h1 mt-8">${bal.available.toFixed(2)} <span className="subtle" style={{ fontSize: 14 }}>available</span></div>
            <div className="subtle mt-6">Pending: ${bal.pending.toFixed(2)}</div>
            <div className="button-row mt-12">
              <button className="button-secondary" onClick={connectBank}>Connect bank</button>
              <button className="button-primary" onClick={withdraw} disabled={bal.available <= 0}>Withdraw</button>
            </div>
          </div>
          <div className="card card-pad">
            <h3>Recent activity</h3>
            <ul>
              {ledger.length === 0 && <li className="subtle">No transactions yet</li>}
              {ledger.map(l => (
                <li key={l.id} className="subtle">
                  {l.type === 'credit' ? '+' : '-'}${l.amount.toFixed(2)} {l.currency} — {l.note} <span className="dim">({new Date(l.createdAt).toLocaleString()}{l.status ? ` · ${l.status}` : ''})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
