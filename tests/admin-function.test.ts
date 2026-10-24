import { beforeEach, describe, expect, it } from 'vitest';
import { emailFor, handle, type Backend, type ProfileRow } from '../supabase/functions/admin/handler.ts';

interface FakeUser {
  id: string;
  email: string;
  password: string;
  banned: boolean;
}
let users: FakeUser[];
let profiles: (ProfileRow & { name: string; must_change: boolean })[];
let failProfileInsert = false;

const backend: Backend = {
  async userFromToken(token) {
    return users.find((u) => `token-${u.id}` === token)?.id ?? null;
  },
  async profile(id) {
    return profiles.find((p) => p.id === id) ?? null;
  },
  async profileByUsername(username) {
    return profiles.find((p) => p.username === username) ?? null;
  },
  async usernameTaken(username) {
    return profiles.some((p) => p.username === username);
  },
  async createAuthUser(email, password) {
    const id = `u${users.length + 1}`;
    users.push({ id, email, password, banned: false });
    return id;
  },
  async deleteAuthUser(id) {
    users = users.filter((u) => u.id !== id);
    profiles = profiles.filter((p) => p.id !== id);
  },
  async setPassword(id, password) {
    users.find((u) => u.id === id)!.password = password;
  },
  async setBanned(id, banned) {
    users.find((u) => u.id === id)!.banned = banned;
  },
  async insertProfile(p) {
    if (failProfileInsert) throw new Error('insert failed');
    profiles.push({ ...p, disabled: false });
  },
  async updateProfile(id, patch) {
    Object.assign(profiles.find((p) => p.id === id)!, patch);
  },
};

const ORIGIN = 'https://iolom.github.io';
const call = (body: unknown, token: string | null = 'token-admin') =>
  handle(new Request('https://x.supabase.co/functions/v1/admin', { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }), { backend, origins: [ORIGIN] });
const ok = async (body: unknown, token?: string | null) => {
  const r = await call(body, token);
  return { status: r.status, body: (await r.json()) as { ok?: boolean; id?: string; error?: string } };
};

beforeEach(() => {
  failProfileInsert = false;
  users = [
    { id: 'admin', email: emailFor('iolo'), password: 'admin-pass', banned: false },
    { id: 'ana', email: emailFor('ana'), password: 'ana-pass', banned: false },
  ];
  profiles = [
    { id: 'admin', username: 'iolo', name: 'Iolo', admin: true, disabled: false, must_change: false },
    { id: 'ana', username: 'ana', name: 'Ana', admin: false, disabled: false, must_change: false },
  ];
});

describe('admin function', () => {
  it('only admins may manage logins', async () => {
    expect((await ok({ action: 'create' }, null)).status).toBe(401);
    expect((await ok({ action: 'create' }, 'token-nobody')).status).toBe(401);
    expect((await ok({ action: 'create', username: 'x', name: 'X' }, 'token-ana')).status).toBe(403);
    profiles[0].disabled = true;
    expect((await ok({ action: 'create', username: 'x', name: 'X' })).status).toBe(403);
  });

  it('makes a login with just a name and username; nobody knows its password until they choose one', async () => {
    const r = await ok({ action: 'create', username: ' Ben ', name: 'Ben Hart', admin: false });
    expect(r).toMatchObject({ status: 200, body: { ok: true } });
    expect(users.at(-1)!.email).toBe('ben@login.invalid');
    expect(users.at(-1)!.password).toMatch(/^[A-Za-z0-9x]{36}$/); // random, never shown
    expect(profiles.at(-1)).toMatchObject({ username: 'ben', name: 'Ben Hart', admin: false, must_change: true });
    expect((await ok({ action: 'create', username: 'ben', name: 'B' })).status).toBe(409);
    expect((await ok({ action: 'create', username: 'Bad Name', name: 'B' })).status).toBe(400);
    expect((await ok({ action: 'create', username: 'dee', name: '' })).status).toBe(400);
  });

  it('the first sign-in chooses the password, once — without being signed in', async () => {
    await ok({ action: 'create', username: 'ben', name: 'Ben' });
    expect((await ok({ action: 'status', username: 'BEN' }, null)).body).toEqual({ status: 'new' });
    expect((await ok({ action: 'status', username: 'ana' }, null)).body).toEqual({ status: 'ready' });
    expect((await ok({ action: 'status', username: 'nobody' }, null)).body).toEqual({ status: 'none' });
    expect((await ok({ action: 'claim', username: 'ben', password: '123' }, null)).status).toBe(400);
    expect((await ok({ action: 'claim', username: 'ben', password: 'bens-own-1' }, null)).status).toBe(200);
    expect(users.at(-1)!.password).toBe('bens-own-1');
    expect(profiles.at(-1)!.must_change).toBe(false);
    // nobody can take it over afterwards
    expect((await ok({ action: 'claim', username: 'ben', password: 'hijack-123' }, null)).status).toBe(409);
    expect((await ok({ action: 'claim', username: 'ana', password: 'hijack-123' }, null)).status).toBe(409);
    expect((await ok({ action: 'claim', username: 'nobody', password: 'whatever1' }, null)).status).toBe(404);
    expect(users.find((u) => u.id === 'ana')!.password).toBe('ana-pass');
  });

  it('a reset makes them choose a new password; a switched-off login can’t be claimed', async () => {
    expect((await ok({ action: 'reset', id: 'ana' })).status).toBe(200);
    expect(users[1].password).not.toBe('ana-pass');
    expect(profiles[1].must_change).toBe(true);
    expect((await ok({ action: 'status', username: 'ana' }, null)).body).toEqual({ status: 'new' });
    await ok({ action: 'disable', id: 'ana', disabled: true });
    expect((await ok({ action: 'status', username: 'ana' }, null)).body).toEqual({ status: 'off' });
    expect((await ok({ action: 'claim', username: 'ana', password: 'new-pass-1' }, null)).status).toBe(403);
  });

  it('shares admin, switches logins off and removes them — never your own', async () => {
    expect((await ok({ action: 'admin', id: 'ana', admin: true })).status).toBe(200);
    expect(profiles[1].admin).toBe(true);
    expect((await ok({ action: 'admin', id: 'admin', admin: false })).status).toBe(400);
    expect((await ok({ action: 'disable', id: 'ana', disabled: true })).status).toBe(200);
    expect(users[1].banned).toBe(true);
    expect(profiles[1].disabled).toBe(true);
    expect((await ok({ action: 'disable', id: 'admin', disabled: true })).status).toBe(400);
    expect((await ok({ action: 'rename', id: 'ana', name: 'Ana Bell' })).status).toBe(200);
    expect(profiles[1].name).toBe('Ana Bell');
    expect((await ok({ action: 'delete', id: 'admin' })).status).toBe(400);
    expect((await ok({ action: 'delete', id: 'ana' })).status).toBe(200);
    expect(profiles.map((p) => p.id)).toEqual(['admin']);
    expect((await ok({ action: 'reset', id: 'ana' })).status).toBe(404);
    expect((await ok({ action: 'launch-rockets' })).status).toBe(400);
  });

  it('removes the half-made login if its profile can’t be saved', async () => {
    failProfileInsert = true;
    expect((await ok({ action: 'create', username: 'eve', name: 'Eve' })).status).toBe(500);
    expect(users.map((u) => u.id)).toEqual(['admin', 'ana']);
  });

  it('answers the browser’s CORS check only for the app’s own address', async () => {
    const pre = await handle(new Request('https://x/functions/v1/admin', { method: 'OPTIONS', headers: { origin: ORIGIN } }), { backend, origins: [ORIGIN] });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(pre.headers.get('access-control-allow-headers')).toContain('authorization');
    const other = await handle(new Request('https://x/functions/v1/admin', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), { backend, origins: [ORIGIN] });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
