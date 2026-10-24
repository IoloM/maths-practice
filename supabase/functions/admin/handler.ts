/**
 * Managing logins, for admins only: make a login, reset a password, make or unmake an admin,
 * switch a login off or on, rename, remove. Runs as a Supabase Edge Function with the secret key
 * (it is the only code that has it); the app calls it with the signed-in admin's session token.
 *
 * Everything Supabase-specific is behind `Backend` (see backend.ts), so this file is plain
 * TypeScript that the app's tests run under Node.
 */
export interface ProfileRow {
  id: string;
  username: string;
  admin: boolean;
  disabled: boolean;
}

export interface Backend {
  /** the user a session token belongs to, or null */
  userFromToken(token: string): Promise<string | null>;
  profile(id: string): Promise<ProfileRow | null>;
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
    const token = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')?.[1];
    const me = token ? await b.userFromToken(token) : null;
    if (!me) throw new Problem(401, 'Please sign in again.');
    const mine = await b.profile(me);
    if (!mine?.admin || mine.disabled) throw new Problem(403, 'Only an admin can manage logins.');

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      throw new Problem(400, 'Invalid request');
    }
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
        const username = str(body.username).trim().toLowerCase();
        if (!USERNAME.test(username)) throw new Problem(400, 'Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
        const name = checkName(body.name);
        const password = checkPassword(body.password);
        if (await b.usernameTaken(username)) throw new Problem(409, `The username "${username}" is taken.`);
        const id = await b.createAuthUser(emailFor(username), password, { username, name });
        try {
          await b.insertProfile({ id, username, name, admin: body.admin === true, must_change: true });
        } catch (e) {
          await b.deleteAuthUser(id); // don't leave a login without a profile
          throw e;
        }
        return json({ ok: true, id }, 200, headers);
      }
      case 'reset': {
        const p = await target();
        await b.setPassword(p.id, checkPassword(body.password));
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
