/**
 * Encrypted progress sync. The app encrypts its data with a key derived from the student's sync
 * code and sends only ciphertext; the row id is a hash of the code. The server never sees either.
 * Writes use optimistic concurrency: a PUT names the version it was based on, so two devices
 * can't silently overwrite each other (the loser pulls, merges and tries again).
 */
import type { Env } from './env';
import { HttpError, json, readJson } from './http';

const ID = /^[0-9a-f]{64}$/;
export const MAX_SYNC_CHARS = 1_500_000;
const MAX_ROWS = 5000;

interface Row {
  v: number;
  data: string;
  updated_at: number;
}

export async function getSync(env: Env, id: string, headers: Record<string, string>): Promise<Response> {
  if (!ID.test(id)) throw new HttpError(400, 'Bad sync id');
  const row = await env.DB.prepare('SELECT v, data, updated_at FROM sync WHERE id = ?').bind(id).first<Row>();
  if (!row) return json({ v: 0 }, 404, headers);
  return json({ v: row.v, data: row.data, updatedAt: row.updated_at }, 200, headers);
}

export async function putSync(env: Env, id: string, req: Request, headers: Record<string, string>, now = Date.now()): Promise<Response> {
  if (!ID.test(id)) throw new HttpError(400, 'Bad sync id');
  const body = await readJson<{ base?: unknown; data?: unknown }>(req, MAX_SYNC_CHARS + 1000);
  if (typeof body.data !== 'string' || !body.data || body.data.length > MAX_SYNC_CHARS) throw new HttpError(400, 'Missing or oversized data');
  if (typeof body.base !== 'number' || !Number.isInteger(body.base) || body.base < 0) throw new HttpError(400, 'Missing base version');
  let changed: number;
  if (body.base === 0) {
    const rows = await env.DB.prepare('SELECT COUNT(*) AS n FROM sync').first<{ n: number }>();
    if ((rows?.n ?? 0) >= MAX_ROWS) throw new HttpError(507, 'Sync storage is full');
    const r = await env.DB.prepare('INSERT INTO sync (id, v, data, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(id) DO NOTHING').bind(id, body.data, now).run();
    changed = r.meta.changes ?? 0;
  } else {
    const r = await env.DB.prepare('UPDATE sync SET v = v + 1, data = ?, updated_at = ? WHERE id = ? AND v = ?').bind(body.data, now, id, body.base).run();
    changed = r.meta.changes ?? 0;
  }
  if (!changed) {
    const cur = await env.DB.prepare('SELECT v FROM sync WHERE id = ?').bind(id).first<{ v: number }>();
    return json({ error: 'Someone else synced first: pull, merge and try again', v: cur?.v ?? 0 }, 409, headers);
  }
  return json({ v: body.base + 1 }, 200, headers);
}
