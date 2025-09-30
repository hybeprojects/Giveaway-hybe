import supabase from './utils/supabase.js';

function isStrongPassword(pw) {
  if (typeof pw !== 'string') return false;
  if (pw.length < 8) return false;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^\w\s]/.test(pw);
  return hasLower && hasUpper && (hasNum || hasSym);
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const authz = event.headers['authorization'] || event.headers['Authorization'];
    if (!authz || !authz.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }
    const accessToken = authz.slice('Bearer '.length);

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const { password } = JSON.parse(event.body || '{}');
    if (!isStrongPassword(password)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Weak password. Use 8+ chars with upper/lowercase and a number or symbol.' }) };
    }

    // Use admin API to set password for this verified user id
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (updateError) {
      console.error('Password update failed', updateError);
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Failed to set password' }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, message: 'Password set successfully' }) };
  } catch (e) {
    console.error('Error in /set-password', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };
