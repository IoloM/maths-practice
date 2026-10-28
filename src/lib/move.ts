/**
 * Moving from iolom.github.io/maths-practice to iolomaths.co.uk. Browsers keep each address's saved
 * data apart, so the old copy hands everything over to the new one: it opens the new address and
 * sends its databases and settings by postMessage, addressed to the new address only. The new
 * address (`#/move`) accepts them only from the old one, and merges them in — nothing already there
 * is overwritten. From then on the old address sends that device straight to the new one.
 */
import { openIdbStore } from '../storage/idb';
import { validateBackup } from '../storage';
import type { BackupFile } from '../storage/types';
import { DEFAULT_DB, deviceLogins } from './logins';
import { cloudMe } from './cloud';

export const OLD_ORIGIN = 'https://iolom.github.io';
export const NEW_ORIGIN = 'https://iolomaths.co.uk';
export const NEW_SITE = `${NEW_ORIGIN}/`;
export const onOldSite = () => window.location.origin === OLD_ORIGIN;
/** set at the old address once this device's progress has moved: from then on it forwards */
const MOVED = 'mp-moved';
export const movedAlready = () => {
  try {
    return !!localStorage.getItem(MOVED);
  } catch {
    return false;
  }
};

/** Is the app being served at the new address yet? */
export async function newSiteLive(): Promise<boolean> {
  try {
    const r = await fetch(`${NEW_ORIGIN}/manifest.webmanifest`, { cache: 'no-store' });
    return r.ok && (await r.json()).short_name === 'Maths Practice';
  } catch {
    return false;
  }
}

export interface Parcel {
  kind: 'mp-move';
  dbs: Record<string, BackupFile>;
  local: Record<string, string>;
}
const READY = 'mp-move-ready';
const DONE = 'mp-move-done';

/** This app's databases: every one is named maths-practice or maths-practice-…. */
async function dbNames(): Promise<string[]> {
  const known = new Set([DEFAULT_DB, ...deviceLogins().map((u) => u.db)]);
  const me = cloudMe();
  if (me) known.add(`${DEFAULT_DB}-c-${me.id}`);
  try {
    for (const d of (await indexedDB.databases?.()) ?? []) if (d.name && (d.name === DEFAULT_DB || d.name.startsWith(`${DEFAULT_DB}-`))) known.add(d.name);
  } catch {
    /* older browsers: the known names are enough */
  }
  return [...known];
}

export async function pack(): Promise<Parcel> {
  const dbs: Record<string, BackupFile> = {};
  for (const name of await dbNames()) {
    const s = await openIdbStore(name);
    const b = await s.exportAll();
    s.close();
    if (b.stores.attempts.length || b.stores.cards.length || b.stores.sets.length || b.stores.settings.length || b.stores.drafts.length) dbs[name] = b;
  }
  const local: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('mp.')) local[k] = localStorage.getItem(k) ?? '';
  }
  return { kind: 'mp-move', dbs, local };
}

/** Merge a parcel into this address; returns how many answered questions came across. */
export async function unpack(p: Parcel): Promise<number> {
  let n = 0;
  for (const [name, b] of Object.entries(p.dbs ?? {})) {
    if (!(name === DEFAULT_DB || name.startsWith(`${DEFAULT_DB}-`)) || !validateBackup(b)) continue;
    const s = await openIdbStore(name);
    await s.importAll(b, 'merge');
    s.close();
    n += b.stores.attempts.length;
  }
  for (const [k, v] of Object.entries(p.local ?? {})) if (k.startsWith('mp.') && typeof v === 'string' && localStorage.getItem(k) === null) localStorage.setItem(k, v);
  return n;
}

/**
 * Old address: hand everything to the new address open in `win`. Resolves with the count it stored.
 * Call it straight after opening the window, so the listener is there before the new page asks.
 */
export function sendTo(win: Window, parcel: Promise<Parcel>, timeout = 90_000): Promise<number> {
  return new Promise((resolve, reject) => {
    const stop = () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
    const timer = window.setTimeout(() => (stop(), reject(new Error('The new address didn’t answer'))), timeout);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== NEW_ORIGIN || e.source !== win) return;
      if (e.data === READY) void parcel.then((p) => win.postMessage(p, NEW_ORIGIN));
      else if (e.data?.kind === DONE) {
        stop();
        resolve(Number(e.data.n) || 0);
      }
    };
    window.addEventListener('message', onMessage);
  });
}

/** New address (`#/move`): ask the old address for the parcel, store it, say so. */
export function receive(onDone: (n: number) => void, onError: (m: string) => void): () => void {
  const opener = window.opener as Window | null;
  if (!opener) {
    onError('none');
    return () => {};
  }
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== OLD_ORIGIN || e.source !== opener || e.data?.kind !== 'mp-move') return;
    window.removeEventListener('message', onMessage);
    unpack(e.data as Parcel)
      .then((n) => {
        opener.postMessage({ kind: DONE, n }, OLD_ORIGIN);
        onDone(n);
      })
      .catch((err: unknown) => onError(err instanceof Error ? err.message : 'Couldn’t save it here'));
  };
  window.addEventListener('message', onMessage);
  opener.postMessage(READY, OLD_ORIGIN);
  return () => window.removeEventListener('message', onMessage);
}

/** Old address, after moving: remember it, and drop the offline copy. */
export async function retireOldSite(): Promise<void> {
  try {
    localStorage.setItem(MOVED, String(Date.now()));
  } catch {
    /* private mode */
  }
  try {
    for (const r of (await navigator.serviceWorker?.getRegistrations()) ?? []) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  } catch {
    /* nothing to remove */
  }
}
