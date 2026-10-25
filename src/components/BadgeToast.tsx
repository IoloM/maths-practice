import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import { onProgressChange } from '../progress/record';
import { earned, type Badge } from '../lib/badges';
import type { PaperResults } from '../lib/paper-results';
import { settingsKey } from '../lib/logins';
import { Icon } from './Icon';

const seenKey = () => `mp.badges.seen:${settingsKey()}`;

/** Says so when you earn a badge (the ones you had before this device saw them don't pop up). */
export function BadgeToast() {
  const [fresh, setFresh] = useState<Badge[]>([]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const store = await getStore();
      const [attempts, sets, papers] = await Promise.all([store.allAttempts(), store.allSets(), store.getSetting<PaperResults>('pastPaperResults', {})]);
      const got = earned({ attempts, sets, papers });
      let seen: string[] | null = null;
      try {
        seen = JSON.parse(localStorage.getItem(seenKey()) ?? 'null');
        localStorage.setItem(seenKey(), JSON.stringify([...new Set([...(seen ?? []), ...got.map((b) => b.id)])]));
      } catch {
        return;
      }
      // the first look on this device: what you have already isn't news
      if (seen === null || !attempts.length) return;
      const news = got.filter((b) => !seen!.includes(b.id));
      if (news.length) setFresh((f) => [...f, ...news]);
    };
    void check();
    const off = onProgressChange(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void check(), 1200);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  const b = fresh[0];
  // it goes by itself after a few seconds, so it never sits over what you're doing
  useEffect(() => {
    if (!b) return;
    const t = setTimeout(() => setFresh((f) => f.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [b]);
  if (!b) return null;
  return (
    <div className="toast badge-toast" role="status">
      <Icon name="award" />
      <span>
        New badge: <b>{b.title}</b> — {b.how.charAt(0).toLowerCase() + b.how.slice(1)}.
      </span>
      <button className="btn btn-small" onClick={() => setFresh((f) => f.slice(1))}>
        OK
      </button>
    </div>
  );
}
