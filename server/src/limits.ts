/** Access code for AI requests, and a daily cap on AI calls so a leak can't run up a large bill. */
import type { Env } from './env';
import { HttpError } from './http';

/** Compare without leaking how many characters matched. */
export function sameSecret(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a),
    y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function requireAi(env: Env, req: Request): void {
  if (!env.ANTHROPIC_API_KEY || !env.ACCESS_CODE) throw new HttpError(503, 'AI features are not set up on this server');
  const code = req.headers.get('x-access-code') ?? '';
  if (!code || !sameSecret(code, env.ACCESS_CODE)) throw new HttpError(401, 'Wrong or missing access code');
}

/** Count one AI call for today; refuse once the daily limit is reached. */
export async function countAiCall(env: Env, now = new Date()): Promise<void> {
  const limit = Number(env.DAILY_AI_LIMIT ?? 200) || 200;
  const day = now.toISOString().slice(0, 10);
  const row = await env.DB.prepare("INSERT INTO usage (day, kind, n) VALUES (?, 'ai', 1) ON CONFLICT(day, kind) DO UPDATE SET n = n + 1 RETURNING n").bind(day).first<{ n: number }>();
  if ((row?.n ?? 0) > limit) throw new HttpError(429, `Today's AI limit (${limit}) has been reached — it resets at midnight UTC`);
}
