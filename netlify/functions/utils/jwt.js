import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';
  if (!secret) throw new Error('Missing SUPABASE_JWT_SECRET');
  return secret;
};

export function mintSessionToken(email, ttlSeconds = 60 * 60 * 24) {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    email,
    sub: email,
    role: 'authenticated',
    aud: 'authenticated',
    iss: 'hybe-giveaway',
    iat: now,
    exp: now + ttlSeconds,
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

export function verifySessionToken(token) {
  const secret = getSecret();
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return { ok: true, email: decoded.email || decoded.sub, payload: decoded };
  } catch (e) {
    return { ok: false, error: e };
  }
}
