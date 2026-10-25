// Copy everything on the Supabase project to this computer (backups/<date-time>/), run by
// supabase/backup.sh with the secret key from the environment: SUPABASE_URL, SECRET_KEY.
import { mkdirSync, writeFileSync } from 'node:fs';

const { SUPABASE_URL, SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SECRET_KEY');
  process.exit(1);
}
const headers = { apikey: SECRET_KEY, ...(SECRET_KEY.startsWith('eyJ') ? { authorization: `Bearer ${SECRET_KEY}` } : {}) };
async function get(path) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}
/** All rows of a table, a page at a time. */
async function table(name) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const page = await get(`/rest/v1/${name}?select=*&offset=${from}&limit=500`);
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

const dir = `${process.env.BACKUP_DIR || 'backups'}/${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
mkdirSync(dir, { recursive: true, mode: 0o700 });
const users = [];
for (let page = 1; ; page++) {
  const r = await get(`/auth/v1/admin/users?page=${page}&per_page=100`);
  users.push(...r.users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })));
  if (r.users.length < 100) break;
}
writeFileSync(`${dir}/users.json`, JSON.stringify(users, null, 1), { mode: 0o600 });
for (const name of ['profiles', 'progress', 'progress_history', 'stats', 'activity', 'assignments', 'assignment_results', 'group_target']) {
  const rows = await table(name);
  writeFileSync(`${dir}/${name}.json`, JSON.stringify(rows), { mode: 0o600 });
  console.log(`${name}: ${rows.length}`);
}
console.log(`Saved to ${dir}`);
