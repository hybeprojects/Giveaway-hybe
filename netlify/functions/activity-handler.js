import supabase from './utils/supabase.js';

async function calculateBalance(email) {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('type, amount')
    .eq('email', email)
    .eq('status', 'available');

  if (error) {
    throw error;
  }
  if (!data) return 0;

  return data.reduce((acc, entry) => {
    if (entry.type === 'credit') return acc + entry.amount;
    if (entry.type === 'debit') return acc - entry.amount;
    return acc;
  }, 0);
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Authenticate user with Supabase
  const authz = event.headers['authorization'] || event.headers['Authorization'];
  if (!authz || !authz.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }
  const token = authz.slice('Bearer '.length);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { email, type, detail, amount: amountFromDetail } = JSON.parse(event.body) || {};

    if (user.email !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }
    if (!email || !type) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields: email, type' }) };
    }

    if (type === 'withdrawal') {
      const amount = Number(amountFromDetail || detail);
      if (isNaN(amount) || amount <= 0) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid withdrawal amount' }) };
      }

      const availableBalance = await calculateBalance(email);
      if (availableBalance < amount) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Insufficient balance' }) };
      }

      // Record the debit in the ledger as the source of truth
      const { error: insertError } = await supabase.from('ledger_entries').insert({
        email,
        type: 'debit',
        amount,
        currency: 'points',
        note: 'Withdrawal request',
        status: 'completed', // Assuming withdrawals are final
      });

      if (insertError) {
        throw insertError;
      }
    }

    // Email functionality has been removed as per migration to Supabase for auth emails.
    // Transactional emails like this would need a separate setup if still required.

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /activity-handler function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
