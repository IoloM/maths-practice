/**
 * Phone reminders (web push) for signed-in people. Turning them on asks this device for permission,
 * subscribes it, and saves the subscription (with the hour chosen and the time zone) to the person's
 * account; supabase/functions/remind sends at most one a day, never after 8pm.
 */
import { removeReminder, saveReminder } from './cloud';

/** The public half of the reminder keys (the private half is only on the server). */
const VAPID_PUBLIC_KEY = 'BINFliePkBp-7pUd6ISqI0J2MZDrt9aNyGiAYJQ43IIiIhfgfhyMqNc-wKgBhDaCMuR9B6hwlyywBoFegg9kWu4';
const KEY = 'mp.reminders';
export const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am … 7pm: nothing after 8pm

export const remindersSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
/** On iPhone and iPad, web push only works in the app added to the Home Screen. */
export const needsInstall = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !matchMedia('(display-mode: standalone)').matches;

const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));

async function registration(): Promise<ServiceWorkerRegistration> {
  const ready = navigator.serviceWorker.ready;
  const late = new Promise<never>((_, no) => setTimeout(() => no(new Error('Reminders need the app to be installed for offline use first — reload the page and try again.')), 8000));
  return Promise.race([ready, late]);
}

/** The hour this device reminds at, or null if reminders are off here. */
export function reminderHour(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return v >= 7 && v <= 19 ? v : null;
  } catch {
    return null;
  }
}
const remember = (h: number | null) => {
  try {
    if (h === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(h));
  } catch {
    /* private mode */
  }
};

export async function turnOnReminders(hour: number): Promise<void> {
  hour = Math.max(7, Math.min(19, Math.round(hour)));
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Notifications are blocked for this site. Allow them in your browser’s settings, then try again.');
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC_KEY) }));
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await saveReminder({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, hour, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London' });
  remember(hour);
}

/** Stop reminders on this device (also used when signing out, so the next person doesn't get them). */
export async function turnOffReminders(): Promise<void> {
  remember(null);
  if (!remindersSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  try {
    await removeReminder(sub.endpoint);
  } finally {
    await sub.unsubscribe().catch(() => false);
  }
}
