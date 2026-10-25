import { useEffect, useState } from 'react';
import { assignments, cloudMe, onCloudMe, type Assignment } from '../lib/cloud';
import { todayKey } from '../lib/dates';
import { href } from '../router';

const daysTo = (due: string) => Math.round((new Date(`${due}T12:00:00`).getTime() - new Date(`${todayKey()}T12:00:00`).getTime()) / 86_400_000);
const hiddenKey = () => `mp.due.hidden:${todayKey()}`;

/** Signed in: a reminder at the top when set work is due today or tomorrow (or overdue) and not done. */
export function DueSoon() {
  const [soon, setSoon] = useState<Assignment[]>([]);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(hiddenKey()) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const load = () => {
      const me = cloudMe();
      if (!me) return setSoon([]);
      assignments()
        .then(({ list, results }) => setSoon(list.filter((a) => a.due && daysTo(a.due) <= 1 && daysTo(a.due) >= -7 && !results.some((r) => r.assignmentId === a.id && r.userId === me.id))))
        .catch(() => setSoon([]));
    };
    load();
    return onCloudMe(load);
  }, []);
  if (hidden || !soon.length) return null;
  const a = soon.sort((x, y) => x.due!.localeCompare(y.due!))[0];
  const d = daysTo(a.due!);
  return (
    <div className="guest-note due-note" role="status">
      <span>
        Set work <b>{a.title}</b> is {d < 0 ? 'overdue' : d === 0 ? 'due today' : 'due tomorrow'}
        {soon.length > 1 ? ` (and ${soon.length - 1} more)` : ''}.
      </span>
      <a className="btn btn-small btn-primary" href={href('/group')}>
        Do it
      </a>
      <button
        className="btn btn-small btn-ghost"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(hiddenKey(), '1');
          } catch {
            /* private mode */
          }
        }}
      >
        Later
      </button>
    </div>
  );
}
