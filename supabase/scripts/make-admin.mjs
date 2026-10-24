// Make an admin login, run by supabase/setup.sh on the owner's computer with the project's secret key.
// Like every login, it has no password yet: the owner chooses one the first time they sign in on the
// website (an existing login is reset to that state). Everything comes from the environment:
//   SUPABASE_URL, SECRET_KEY, ADMIN_USER, ADMIN_NAME
import { randomBytes } from 'node:crypto';

const { SUPABASE_URL, SECRET_KEY, ADMIN_USER, ADMIN_NAME } = process.env;
if (!SUPABASE_URL || !SECRET_KEY || !ADMIN_USER) {
  console.error('Missing SUPABASE_URL, SECRET_KEY or ADMIN_USER');
  process.exit(1);
}
// a password nobody knows until the first sign-in replaces it (as in the admin function)
const unknown = randomBytes(27).toString('base64url');
const username = ADMIN_USER.trim().toLowerCase();
const email = `${username}@login.invalid`; // as in supabase/functions/admin/handler.ts
// new secret keys go on the apikey header; a legacy service_role JWT also as the bearer token
const headers = { apikey: SECRET_KEY, 'content-type': 'application/json', ...(SECRET_KEY.startsWith('eyJ') ? { authorization: `Bearer ${SECRET_KEY}` } : {}) };

async function call(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${body?.msg ?? body?.message ?? text}`);
  return body;
}

async function findUser() {
  for (let page = 1; page < 50; page++) {
    const r = await call(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const found = r.users.find((u) => u.email === email);
    if (found || r.users.length < 100) return found ?? null;
  }
  return null;
}

let user = await findUser();
if (user) await call(`/auth/v1/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ password: unknown, ban_duration: 'none' }) });
else user = await call('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password: unknown, email_confirm: true, user_metadata: { username, name: ADMIN_NAME } }) });

await call('/rest/v1/profiles?on_conflict=id', {
  method: 'POST',
  headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify({ id: user.id, username, name: (ADMIN_NAME || username).slice(0, 60), admin: true, must_change: true, disabled: false }),
});
console.log(`Admin login "${username}" is ready: choose its password when you first sign in on the website.`);
