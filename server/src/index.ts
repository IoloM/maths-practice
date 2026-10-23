/**
 * Maths Practice API (Cloudflare Worker).
 *   GET  /health                  → { ok, ai }
 *   GET  /sync/:id, PUT /sync/:id → encrypted progress sync
 *   GET  /ai/check                → is the access code right?         (free; not counted)
 *   POST /auth/login, /auth/logout, /auth/password                    → logins (bearer token)
 *   GET  /me, PUT /me             → the signed-in person's progress, history and settings
 *   GET  /admin/users, POST /admin/users, PATCH|DELETE /admin/users/:id → managing logins (admins)
 *   POST /ai/read                 → handwritten answer → LaTeX        (needs x-access-code)
 *   POST /ai/mark                 → working marked against the scheme (needs x-access-code)
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Env } from './env';
import { HttpError, corsHeaders, json, readJson } from './http';
import { getSync, putSync } from './sync';
import { countAiCall, requireAi } from './limits';
import { changePassword, createUser, deleteUser, getData, listUsers, login, logout, putData, updateUser } from './auth';
import { MAX_IMAGE_CHARS, markWorking, readHandwriting, type MarkRequest, type ReadRequest } from './ai';

type ClientFactory = (env: Env) => Anthropic;
const defaultClient: ClientFactory = (env) => new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });

export async function handle(req: Request, env: Env, makeClient: ClientFactory = defaultClient): Promise<Response> {
  const cors = corsHeaders(req.headers.get('origin'), env.ALLOWED_ORIGINS);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const { pathname } = new URL(req.url);
  try {
    if (pathname === '/health' && req.method === 'GET') return json({ ok: true, ai: !!(env.ANTHROPIC_API_KEY && env.ACCESS_CODE) }, 200, cors);
    const sync = /^\/sync\/([^/]+)$/.exec(pathname);
    if (sync) {
      if (req.method === 'GET') return await getSync(env, sync[1], cors);
      if (req.method === 'PUT') return await putSync(env, sync[1], req, cors);
    }
    if (pathname === '/auth/login' && req.method === 'POST') return json(await login(env, req), 200, cors);
    if (pathname === '/auth/logout' && req.method === 'POST') return json(await logout(env, req), 200, cors);
    if (pathname === '/auth/password' && req.method === 'POST') return json(await changePassword(env, req), 200, cors);
    if (pathname === '/me' && req.method === 'GET') return json(await getData(env, req), 200, cors);
    if (pathname === '/me' && req.method === 'PUT') {
      const r = await putData(env, req);
      return json(r.body, r.status, cors);
    }
    if (pathname === '/admin/users' && req.method === 'GET') return json(await listUsers(env, req), 200, cors);
    if (pathname === '/admin/users' && req.method === 'POST') return json(await createUser(env, req), 200, cors);
    const user = /^\/admin\/users\/(\d+)$/.exec(pathname);
    if (user && req.method === 'PATCH') return json(await updateUser(env, req, Number(user[1])), 200, cors);
    if (user && req.method === 'DELETE') return json(await deleteUser(env, req, Number(user[1])), 200, cors);
    if (pathname === '/ai/check' && req.method === 'GET') {
      await requireAi(env, req);
      return json({ ok: true }, 200, cors);
    }
    if (pathname === '/ai/read' && req.method === 'POST') {
      await requireAi(env, req);
      const body = await readJson<ReadRequest>(req, MAX_IMAGE_CHARS + 10_000);
      await countAiCall(env);
      return json(await readHandwriting(makeClient(env), body), 200, cors);
    }
    if (pathname === '/ai/mark' && req.method === 'POST') {
      await requireAi(env, req);
      const body = await readJson<MarkRequest>(req, MAX_IMAGE_CHARS + 40_000);
      await countAiCall(env);
      return json(await markWorking(makeClient(env), body), 200, cors);
    }
    return json({ error: 'Not found' }, 404, cors);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'The AI is busy — try again in a minute' }, 503, cors);
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic', e.status, e.message);
      return json({ error: 'The AI service returned an error — try again later' }, 502, cors);
    }
    console.error(e);
    return json({ error: 'Server error' }, 500, cors);
  }
}

export default { fetch: (req: Request, env: Env) => handle(req, env) } satisfies ExportedHandler<Env>;
