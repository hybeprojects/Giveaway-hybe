import { useEffect, useMemo, useState } from 'react';
import { getSession, signOut, isSupabaseConfigured } from '../utils/supabaseClient';
import { balances, getLedger, addDebit } from '../utils/balance';
import { getLocalSession, clearLocalSession } from '../utils/auth';

export default function Dashboard() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const bal = useMemo(() => balances(), []);
  const ledger = useMemo(() => getLedger(), []);

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

  const withdraw = () => {
    const amount = prompt('Enter amount to withdraw (available: ' + bal.available.toFixed(2) + '):');
    if (!amount) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > bal.available) { alert('Invalid amount'); return; }
    // In production, call backend to create Stripe payout. Here we record a debit locally for dev.
    addDebit(n);
    try { await fetch('/.netlify/functions/activity-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'withdrawal', detail: `Withdrawal requested: $${n.toFixed(2)}` }) }); } catch {}
    window.location.reload();
  };

  const connectBank = async () => {
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert('Bank connection will be enabled after Stripe Connect is configured.');
      }
    } catch {
      alert('Bank connection will be enabled after Stripe Connect is configured.');
    }
  };

  if (loading) return (
    <section className="section" aria-label="Dashboard Loading">
      <div className="container"><div className="card" style={{ padding: 16 }}>Loading…</div></div>
    </section>
  );

  return (
    <section className="section" aria-label="Dashboard">
      <div className="container">
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Your Giveaway Dashboard</h2>
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

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card" style={{ padding: 16 }}>
            <h3>Balance</h3>
            <div className="h1" style={{ marginTop: 8 }}>${bal.available.toFixed(2)} <span className="subtle" style={{ fontSize: 14 }}>available</span></div>
            <div className="subtle" style={{ marginTop: 6 }}>Pending: ${bal.pending.toFixed(2)}</div>
            <div className="button-row" style={{ marginTop: 12 }}>
              <button className="button-secondary" onClick={connectBank}>Connect bank</button>
              <button className="button-primary" onClick={withdraw} disabled={bal.available <= 0}>Withdraw</button>
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h3>Recent activity</h3>
            <ul>
              {ledger.length === 0 && <li className="subtle">No transactions yet</li>}
              {ledger.map(l => (
                <li key={l.id} className="subtle">
                  {l.type === 'credit' ? '+' : '-'}${l.amount.toFixed(2)} {l.currency} — {l.note} <span style={{ opacity: 0.7 }}>({new Date(l.createdAt).toLocaleString()}{l.status ? ` · ${l.status}` : ''})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
