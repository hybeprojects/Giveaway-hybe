export type LedgerEntry = { id: string; type: 'credit' | 'debit'; amount: number; currency: string; note: string; createdAt: string; status?: 'pending' | 'available' };

const LS_LEDGER_KEY = 'ledger';

function read(): LedgerEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_LEDGER_KEY) || '[]'); } catch { return []; }
}
function write(items: LedgerEntry[]) {
  localStorage.setItem(LS_LEDGER_KEY, JSON.stringify(items));
}

export function getLedger() {
  return read().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addCredit(amount: number, currency = 'USD', note = 'Giveaway credit', status: 'pending' | 'available' = 'pending') {
  const items = read();
  items.push({ id: crypto.randomUUID(), type: 'credit', amount, currency, note, status, createdAt: new Date().toISOString() });
  write(items);
}

export function addDebit(amount: number, currency = 'USD', note = 'Withdrawal') {
  const items = read();
  items.push({ id: crypto.randomUUID(), type: 'debit', amount, currency, note, createdAt: new Date().toISOString() });
  write(items);
}

export function balances() {
  const items = read();
  const pending = items.filter(i => i.type === 'credit' && i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const availableCredits = items.filter(i => i.type === 'credit' && (i.status === 'available' || !i.status)).reduce((s, i) => s + i.amount, 0);
  const debits = items.filter(i => i.type === 'debit').reduce((s, i) => s + i.amount, 0);
  const available = Math.max(0, availableCredits - debits);
  return { pending, available };
}
