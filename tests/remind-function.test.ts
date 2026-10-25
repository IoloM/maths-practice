import { describe, expect, it } from 'vitest';
import { handle, localNow, message, type Backend, type Sub } from '../supabase/functions/remind/handler.ts';

const sub = (extra: Partial<Sub> = {}): Sub => ({ user_id: 'u1', endpoint: 'https://push.example/1', p256dh: 'k', auth: 'a', hour: 17, tz: 'Europe/London', last_sent: null, ...extra });
// 20 Oct 2026, British Summer Time: 16:30 UTC is 17:30 in London
const AT_5PM = new Date(Date.UTC(2026, 9, 20, 16, 30));

describe('phone reminders', () => {
  it('works out the local hour and day in the person’s time zone', () => {
    expect(localNow('Europe/London', AT_5PM)).toEqual({ day: '2026-10-20', hour: 17 });
    expect(localNow('Australia/Perth', AT_5PM)).toEqual({ day: '2026-10-21', hour: 0 });
    expect(localNow('Not/AZone', AT_5PM).hour).toBe(17);
  });

  it('from the chosen hour (so a late run still sends), once a day, and never after 8pm', () => {
    expect(message(sub(), undefined, [], new Set(), AT_5PM)).not.toBeNull();
    expect(message(sub({ hour: 16 }), undefined, [], new Set(), AT_5PM)).not.toBeNull();
    expect(message(sub({ hour: 18 }), undefined, [], new Set(), AT_5PM)).toBeNull();
    expect(message(sub({ last_sent: '2026-10-20' }), undefined, [], new Set(), AT_5PM)).toBeNull();
    const at9pm = new Date(Date.UTC(2026, 9, 20, 20, 30));
    expect(message(sub({ hour: 19 }), undefined, [], new Set(), at9pm)).toBeNull();
    expect(message(sub({ hour: 19 }), undefined, [], new Set(), new Date(Date.UTC(2026, 9, 20, 18, 59)))).not.toBeNull();
  });

  it('no nudge if they practised today; set work due soon still gets one', () => {
    const today = { lastActive: Date.UTC(2026, 9, 20, 9), streak: 4 };
    expect(message(sub(), today, [], new Set(), AT_5PM)).toBeNull();
    const work = [{ id: 'w1', title: 'Integration', due: '2026-10-21' }];
    expect(message(sub(), today, work, new Set(), AT_5PM)?.title).toBe('Set work due tomorrow');
    expect(message(sub(), today, work, new Set(['w1:u1']), AT_5PM)).toBeNull();
    expect(message(sub(), { lastActive: Date.UTC(2026, 9, 19, 9), streak: 4 }, [], new Set(), AT_5PM)?.title).toBe('Keep your 4-day streak going');
  });

  it('needs the secret; sends, forgets dead subscriptions, and marks the day', async () => {
    const sent: string[] = [],
      removed: string[] = [],
      marked: string[] = [];
    const subs = [sub(), sub({ endpoint: 'https://push.example/gone' }), sub({ endpoint: 'https://push.example/later', hour: 19 })];
    const backend: Backend = {
      subscriptions: async () => subs,
      summaries: async () => new Map(),
      work: async () => ({ list: [], done: new Set() }),
      send: async (s, payload) => (sent.push(`${s.endpoint} ${JSON.parse(payload).title}`), s.endpoint.endsWith('gone') ? 410 : 201),
      markSent: async (s, day) => void marked.push(`${s.endpoint} ${day}`),
      remove: async (s) => void removed.push(s.endpoint),
    };
    const req = (secret?: string) => new Request('https://x/functions/v1/remind', { method: 'POST', headers: secret ? { 'x-remind-secret': secret } : {} });
    expect((await handle(req(), { backend, secret: 's3cret', now: AT_5PM })).status).toBe(401);
    expect((await handle(req('wrong!'), { backend, secret: 's3cret', now: AT_5PM })).status).toBe(401);
    const res = await handle(req('s3cret'), { backend, secret: 's3cret', now: AT_5PM });
    expect(await res.json()).toEqual({ devices: 3, sent: 1, gone: 1, failed: 0 });
    expect(sent).toHaveLength(2);
    expect(removed).toEqual(['https://push.example/gone']);
    expect(marked).toEqual(['https://push.example/1 2026-10-20']);
  });
});
