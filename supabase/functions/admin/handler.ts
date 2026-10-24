/**
 * Logins. An admin makes a login with just a name and a username; the person chooses their own
 * password the first time they sign in ("claim"), on any device. Admins can also reset a login (it
 * goes back to "choose a password"), make or unmake admins, switch logins off or on, rename and
 * remove them. Runs as a Supabase Edge Function with the secret key (the only code that has it);
 * admin actions need the signed-in admin's session token, `status` and `claim` need no sign-in.
 *
 * Until someone claims their login, anyone who knew the username could claim it first: admins see
 * which logins haven't been claimed, and a reset puts a login back to unclaimed.
 *
 * Everything Supabase-specific is behind `Backend` (see backend.ts), so this file is plain
 * TypeScript that the app's tests run under Node.
 */
export interface ProfileRow {
  id: string;
  username: string;
  admin: boolean;
  disabled: boolean;
  /** no password chosen yet: the next sign-in chooses one */
  must_change: boolean;
}

export interface Backend {
  /** the user a session token belongs to, or null */
  userFromToken(token: string): Promise<string | null>;
  profile(id: string): Promise<ProfileRow | null>;
  profileByUsername(username: string): Promise<ProfileRow | null>;
  usernameTaken(username: string): Promise<boolean>;
  createAuthUser(email: string, password: string, meta: Record<string, string>): Promise<string>;
  deleteAuthUser(id: string): Promise<void>;
  setPassword(id: string, password: string): Promise<void>;
  setBanned(id: string, banned: boolean): Promise<void>;
  insertProfile(p: { id: string; username: string; name: string; admin: boolean; must_change: boolean }): Promise<void>;
  updateProfile(id: string, patch: Partial<{ name: string; admin: boolean; disabled: boolean; must_change: boolean }>): Promise<void>;
}

export const USERNAME = /^[a-z0-9]([a-z0-9._-]{0,30}[a-z0-9])?$/;
export const MIN_PASSWORD = 6;
/** Usernames sign in with a made-up address: .invalid can never be a real domain, so no email is sent. */
export const emailFor = (username: string) => `${username}@login.invalid`;

class Problem extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function cors(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const json = (body: unknown, status: number, headers: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

type Body = { action?: unknown; id?: unknown; username?: unknown; name?: unknown; password?: unknown; admin?: unknown; disabled?: unknown };

const str = (x: unknown) => (typeof x === 'string' ? x : '');
/** A password nobody knows, for a login that hasn't been claimed yet. */
export function unguessable(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(27)))).replace(/[+/=]/g, 'x');
}
const usernameOf = (x: unknown) => str(x).trim().toLowerCase();
function checkPassword(p: unknown): string {
  const s = str(p);
  if (s.length < MIN_PASSWORD || s.length > 72) throw new Problem(400, `Passwords need ${MIN_PASSWORD} to 72 characters.`);
  return s;
}
function checkName(n: unknown): string {
  const s = str(n).trim();
  if (!s || s.length > 60) throw new Problem(400, 'Enter a name (up to 60 characters).');
  return s;
}

export async function handle(req: Request, deps: { backend: Backend; origins: string[] }): Promise<Response> {
  const headers = cors(req.headers.get('origin'), deps.origins);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  try {
    if (req.method !== 'POST') throw new Problem(405, 'Use POST');
    const b = deps.backend;
    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      throw new Problem(400, 'Invalid request');
    }

    // ---- no sign-in needed: is this a new login, and choosing its first password
    if (body.action === 'status') {
      const p = await b.profileByUsername(usernameOf(body.username));
      return json({ status: !p ? 'none' : p.disabled ? 'off' : p.must_change ? 'new' : 'ready' }, 200, headers);
    }
    if (body.action === 'claim') {
      const p = await b.profileByUsername(usernameOf(body.username));
      if (!p) throw new Problem(404, 'There’s no login with that username — check it with whoever runs the app.');
      if (p.disabled) throw new Problem(403, 'This login has been switched off.');
      if (!p.must_change) throw new Problem(409, 'This login already has a password — sign in with it, or ask your admin to reset it.');
      await b.setPassword(p.id, checkPassword(body.password));
      await b.updateProfile(p.id, { must_change: false });
      return json({ ok: true }, 200, headers);
    }

    // ---- admins only
    const token = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')?.[1];
    const me = token ? await b.userFromToken(token) : null;
    if (!me) throw new Problem(401, 'Please sign in again.');
    const mine = await b.profile(me);
    if (!mine?.admin || mine.disabled) throw new Problem(403, 'Only an admin can manage logins.');

    const target = async () => {
      const id = str(body.id);
      const p = id ? await b.profile(id) : null;
      if (!p) throw new Problem(404, 'No such login.');
      return p;
    };
    const notMe = (p: ProfileRow, what: string) => {
      if (p.id === me) throw new Problem(400, `You can’t ${what} your own login.`);
    };

    switch (body.action) {
      case 'create': {
        const username = usernameOf(body.username);
        if (!USERNAME.test(username)) throw new Problem(400, 'Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
        const name = checkName(body.name);
        if (await b.usernameTaken(username)) throw new Problem(409, `The username "${username}" is taken.`);
        // they choose their own password the first time they sign in
        const id = await b.createAuthUser(emailFor(username), unguessable(), { username, name });
        try {
          await b.insertProfile({ id, username, name, admin: body.admin === true, must_change: true });
        } catch (e) {
          await b.deleteAuthUser(id); // don't leave a login without a profile
          throw e;
        }
        return json({ ok: true, id }, 200, headers);
      }
      case 'reset': {
        // back to "choose a password": the old one stops working, and the next sign-in sets a new one
        const p = await target();
        await b.setPassword(p.id, unguessable());
        await b.updateProfile(p.id, { must_change: true });
        return json({ ok: true }, 200, headers);
      }
      case 'admin': {
        const p = await target();
        if (body.admin !== true && body.admin !== false) throw new Problem(400, 'Say whether they should be an admin.');
        if (!body.admin) notMe(p, 'remove admin from');
        await b.updateProfile(p.id, { admin: body.admin });
        return json({ ok: true }, 200, headers);
      }
      case 'disable': {
        const p = await target();
        notMe(p, 'switch off');
        const disabled = body.disabled === true;
        await b.setBanned(p.id, disabled);
        await b.updateProfile(p.id, { disabled });
        return json({ ok: true }, 200, headers);
      }
      case 'rename': {
        const p = await target();
        await b.updateProfile(p.id, { name: checkName(body.name) });
        return json({ ok: true }, 200, headers);
      }
      case 'delete': {
        const p = await target();
        notMe(p, 'remove');
        await b.deleteAuthUser(p.id); // profile, progress, stats and results go with it (on delete cascade)
        return json({ ok: true }, 200, headers);
      }
      default:
        throw new Problem(400, 'Unknown action');
    }
  } catch (e) {
    if (e instanceof Problem) return json({ error: e.message }, e.status, headers);
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'Server error' }, 500, headers);
  }
}
