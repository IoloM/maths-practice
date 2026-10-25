/**
 * The first time someone signs in to their online login on a device, bring across what they
 * practised there before: their device login's progress if they had one with the same username,
 * or, on a device nobody made logins on, what was practised there without signing in.
 * The next sync then saves it to their account.
 */
import { openIdbStore } from '../storage/idb';
import { getStore } from '../storage';
import type { Me } from './cloud';
import { DEFAULT_DB, DEFAULT_SETTINGS, deviceLogins, forgetDeviceLogin } from './logins';

/** settings-store records that belong to the person (past-paper marks, mistake notes) */
const KEPT = new Set(['pastPaperResults', 'mistakeNotes']);

/** What was done in this visit before signing in (as a guest, kept in memory only). */
async function adoptGuestVisit(target: string): Promise<number> {
  const here = await getStore();
  if (here.kind !== 'memory') return 0;
  const backup = await here.exportAll();
  const n = backup.stores.attempts.length + backup.stores.cards.length + backup.stores.sets.length;
  if (!n && !backup.stores.settings.some((s) => KEPT.has(s.key))) return 0;
  const to = await openIdbStore(target);
  await to.importAll({ ...backup, stores: { ...backup.stores, settings: backup.stores.settings.filter((s) => KEPT.has(s.key)) } }, 'merge');
  to.close();
  return backup.stores.attempts.length;
}

/** Returns how many questions came across. */
export async function adoptLocalProgress(me: Me): Promise<number> {
  const visit = typeof indexedDB === 'undefined' ? 0 : await adoptGuestVisit(`${DEFAULT_DB}-c-${me.id}`);
  const local = deviceLogins().find((u) => u.username === me.username);
  const source = local?.db ?? (deviceLogins().length ? null : DEFAULT_DB);
  const target = `${DEFAULT_DB}-c-${me.id}`;
  // a first sign-in here starts from this device's look and answer boxes; preferences saved to
  // their login (newer than 0) still win at the first sync
  try {
    const mine = `${DEFAULT_SETTINGS}:c-${me.id}`;
    const here = localStorage.getItem(local?.settings ?? DEFAULT_SETTINGS);
    if (here && !localStorage.getItem(mine)) localStorage.setItem(mine, JSON.stringify({ ...JSON.parse(here), prefsAt: 0 }));
  } catch {
    /* private mode */
  }
  if (!source || typeof indexedDB === 'undefined') return visit;

  const from = await openIdbStore(source);
  const backup = await from.exportAll();
  const { attempts, cards, sets } = backup.stores;
  if (attempts.length || cards.length || sets.length || backup.stores.settings.some((s) => KEPT.has(s.key))) {
    const to = await openIdbStore(target);
    await to.importAll({ ...backup, stores: { ...backup.stores, settings: backup.stores.settings.filter((s) => KEPT.has(s.key)) } }, 'merge');
    to.close();
  }
  // the old copy is theirs online now: don't leave it for someone else to pick up
  if (local) {
    from.close();
    await forgetDeviceLogin(local.id);
  } else {
    await from.clearAll();
    from.close();
  }
  return visit + attempts.length;
}
