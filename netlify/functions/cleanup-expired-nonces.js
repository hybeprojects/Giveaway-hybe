import supabase from './utils/supabase.js';

export const config = {
  schedule: '@hourly',
};

export const handler = async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Delete unused nonces that expired over 24h ago
    const del1 = await supabase
      .from('form_nonces')
      .delete()
      .eq('used', false)
      .lt('expires_at', oneDayAgo)
      .select('nonce', { count: 'exact' });

    if (del1.error) throw del1.error;
    const removedExpiredUnused = del1.count || 0;

    // Delete used nonces that were used more than 7 days ago
    const del2 = await supabase
      .from('form_nonces')
      .delete()
      .eq('used', true)
      .lt('used_at', sevenDaysAgo)
      .select('nonce', { count: 'exact' });

    if (del2.error) throw del2.error;
    const removedOldUsed = del2.count || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, removedExpiredUnused, removedOldUsed }),
    };
  } catch (e) {
    console.error('cleanup-expired-nonces error:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal error' }) };
  }
};
