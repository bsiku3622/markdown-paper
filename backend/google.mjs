import { createPublicKey, verify } from 'node:crypto';

// Verifies a Google Identity Services ID token (RS256 JWT) against Google's published keys.
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

export function googleKeys(fetchImpl = fetch) {
  let cache = { keys: [], until: 0 };
  return async (refresh = false) => {
    if (!refresh && cache.until > Date.now()) return cache.keys;
    const response = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('Google keys unavailable');
    const age = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') || '')?.[1] || 3600);
    cache = { keys: (await response.json()).keys || [], until: Date.now() + Math.min(age, 86400) * 1000 };
    return cache.keys;
  };
}

export async function verifyGoogleToken(credential, { clientId, keys, now = Date.now() }) {
  if (typeof credential !== 'string' || credential.length > 4096) return null;
  const parts = credential.split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try { header = decode(parts[0]); claims = decode(parts[1]); } catch { return null; }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
  let jwk = (await keys()).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await keys(true)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const valid = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  if (!valid) return null;
  const skew = 60;
  const seconds = now / 1000;
  if (!ISSUERS.includes(claims.iss) || claims.aud !== clientId || typeof claims.sub !== 'string' || !claims.sub) return null;
  if (typeof claims.exp !== 'number' || claims.exp + skew < seconds) return null;
  if (typeof claims.iat === 'number' && claims.iat - skew > seconds) return null;
  return {
    sub: claims.sub,
    email: claims.email_verified === true && typeof claims.email === 'string' ? claims.email : '',
    name: typeof claims.name === 'string' ? claims.name : '',
    picture: typeof claims.picture === 'string' ? claims.picture : '',
  };
}
