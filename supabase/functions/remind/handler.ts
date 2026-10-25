/**
 * Phone reminders (web push), run every hour by .github/workflows/reminders.yml with a shared secret.
 * For each device that turned reminders on: from the hour that person chose (their local time) until
 * 7:59pm — so a late run still never sends after 8pm — a nudge, but only if they haven't practised
 * yet today or have set work due soon. Nobody gets more than one a day. Plain logic here; the platform parts come in through Backend.
 */
export interface Sub {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  hour: number;
  tz: string;
  last_sent: string | null;
}
export interface Summary {
  lastActive?: number;
  streak?: number;
}
export interface Work {
  id: string;
  title: string;
  due: string | null;
}
export interface Backend {
  subscriptions(): Promise<Sub[]>;
  summaries(): Promise<Map<string, Summary>>;
  work(): Promise<{ list: Work[]; done: Set<string> }>;
  /** resolves to the push service's status code */
  send(sub: Sub, payload: string): Promise<number>;
  markSent(sub: Sub, day: string): Promise<void>;
  remove(sub: Sub): Promise<void>;
}

/** Last hour a reminder may go out: 7pm–7:59pm, so never after 8pm. */
export const LAST_HOUR = 19;

/** Local date (YYYY-MM-DD) and hour in a time zone. */
export function localNow(tz: string, now: Date): { day: string; hour: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** What to say to one person now, or null to say nothing. */
export function message(sub: Sub, summary: Summary | undefined, work: Work[], done: Set<string>, now: Date): { title: string; body: string; url: string } | null {
  const { day, hour } = localNow(sub.tz, now);
  if (hour < sub.hour || hour > LAST_HOUR || sub.last_sent === day) return null;
  const practised = summary?.lastActive ? localNow(sub.tz, new Date(summary.lastActive)).day === day : false;
  const due = work
    .filter((w) => w.due && !done.has(`${w.id}:${sub.user_id}`))
    .map((w) => ({ w, days: daysBetween(day, w.due!) }))
    .filter((x) => x.days >= 0 && x.days <= 1)
    .sort((a, b) => a.days - b.days)[0];
  if (due) return { title: 'Set work due ' + (due.days === 0 ? 'today' : 'tomorrow'), body: `“${due.w.title}” — it only takes a few minutes to start.`, url: './#/group' };
  if (practised) return null;
  const streak = summary?.streak ?? 0;
  if (streak > 1) return { title: `Keep your ${streak}-day streak going`, body: 'One question today keeps it alive. Your plan is ready.', url: './#/' };
  return { title: 'Time for a little maths?', body: 'A few questions today — your plan is ready on the home page.', url: './#/' };
}

const enc = new TextEncoder();
/** Same length and same bytes, without leaking where they differ. */
function same(a: string, b: string): boolean {
  const x = enc.encode(a),
    y = enc.encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

export async function handle(req: Request, opts: { backend: Backend; secret: string; now?: Date }): Promise<Response> {
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });
  if (!opts.secret || !same(req.headers.get('x-remind-secret') ?? '', opts.secret)) return json(401, { error: 'Not allowed' });
  const now = opts.now ?? new Date();
  const b = opts.backend;
  const [subs, summaries, work] = await Promise.all([b.subscriptions(), b.summaries(), b.work()]);
  let sent = 0,
    gone = 0,
    failed = 0;
  for (const sub of subs) {
    const m = message(sub, summaries.get(sub.user_id), work.list, work.done, now);
    if (!m) continue;
    try {
      const status = await b.send(sub, JSON.stringify(m));
      if (status === 404 || status === 410) {
        await b.remove(sub);
        gone++;
      } else if (status >= 200 && status < 300) {
        await b.markSent(sub, localNow(sub.tz, now).day);
        sent++;
      } else failed++;
    } catch {
      failed++;
    }
  }
  return json(200, { devices: subs.length, sent, gone, failed });
}
