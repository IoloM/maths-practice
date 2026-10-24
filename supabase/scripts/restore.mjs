// Put a person's saved progress back to an earlier save (supabase/backup.sh --restore). Their devices
// then merge it with what they have, so nothing they did since is lost either.
//   SUPABASE_URL, SECRET_KEY, USERNAME, and optionally SAVES_AGO (default 1: the save before the latest)
const { SUPABASE_URL, SECRET_KEY, USERNAME, SAVES_AGO = '1' } = process.env;
if (!SUPABASE_URL || !SECRET_KEY || !USERNAME) {
  console.error('Missing SUPABASE_URL, SECRET_KEY or USERNAME');
  process.exit(1);
}
const headers = { apikey: SECRET_KEY, 'content-type': 'application/json', ...(SECRET_KEY.startsWith('eyJ') ? { authorization: `Bearer ${SECRET_KEY}` } : {}) };
async function call(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
const [p] = await call(`/rest/v1/profiles?select=id,name&username=eq.${encodeURIComponent(USERNAME.trim().toLowerCase())}`);
if (!p) throw new Error(`No login called ${USERNAME}`);
const saves = await call(`/rest/v1/progress_history?select=id,v,data,saved_at&user_id=eq.${p.id}&order=id.desc`);
console.log(`${p.name}: ${saves.length} saves kept`);
for (const [i, s] of saves.entries()) console.log(`  ${i}. version ${s.v} saved ${s.saved_at} (${Math.round(s.data.length / 1024)} KB)`);
const pick = saves[Number(SAVES_AGO)];
if (!pick) throw new Error(`There is no save ${SAVES_AGO} back`);
const [cur] = await call(`/rest/v1/progress?select=v&user_id=eq.${p.id}`);
await call(`/rest/v1/progress?user_id=eq.${p.id}`, { method: 'PATCH', headers: { prefer: 'return=minimal' }, body: JSON.stringify({ data: pick.data, v: (cur?.v ?? 0) + 1, updated_at: new Date().toISOString() }) });
console.log(`Restored ${p.name}'s progress to version ${pick.v} (saved ${pick.saved_at}). Their devices merge it in at their next sync.`);
