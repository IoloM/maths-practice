// Supabase Edge Function entry (Deno): reads subscriptions with the secret key and sends web push
// with the VAPID keys, all from the platform's own environment (supabase secrets).
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { handle, type Backend, type Sub } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
const key = secrets.default ?? Object.values(secrets)[0] ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
webpush.setVapidDetails('https://iolom.github.io/maths-practice/', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);

const backend: Backend = {
  async subscriptions() {
    const { data, error } = await db.from('push_subscriptions').select('user_id, endpoint, p256dh, auth, hour, tz, last_sent');
    if (error) throw error;
    return data as Sub[];
  },
  async summaries() {
    const { data } = await db.from('stats').select('user_id, summary');
    return new Map(((data ?? []) as { user_id: string; summary: { lastActive?: number; streak?: number } }[]).map((r) => [r.user_id, r.summary]));
  },
  async work() {
    const [a, r] = await Promise.all([db.from('assignments').select('id, title, due'), db.from('assignment_results').select('assignment_id, user_id')]);
    return { list: (a.data ?? []) as { id: string; title: string; due: string | null }[], done: new Set(((r.data ?? []) as { assignment_id: string; user_id: string }[]).map((x) => `${x.assignment_id}:${x.user_id}`)) };
  },
  async send(sub, payload) {
    try {
      const res = await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 3 * 3600, urgency: 'normal' });
      return res.statusCode;
    } catch (e) {
      return (e as { statusCode?: number }).statusCode ?? 500;
    }
  },
  async markSent(sub, day) {
    await db.from('push_subscriptions').update({ last_sent: day }).eq('endpoint', sub.endpoint).eq('user_id', sub.user_id);
  },
  async remove(sub) {
    await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).eq('user_id', sub.user_id);
  },
};

Deno.serve((req) => handle(req, { backend, secret: Deno.env.get('REMIND_SECRET') ?? '' }));
