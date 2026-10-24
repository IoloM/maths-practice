import { openIdbStore } from './idb';
import { GUEST_DB, dbName } from '../lib/logins';
import { MemoryStore } from './memory';
import type { BackupFile, Store } from './types';

let storePromise: Promise<Store> | null = null;

/** The app's store (IndexedDB, falling back to memory). */
export function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = (async () => {
      try {
        if (typeof indexedDB === 'undefined') throw new Error('no IndexedDB');
        // a guest (not signed in, online logins): kept in memory only, so nothing is saved
        if (dbName() === GUEST_DB) return new MemoryStore();
        return await openIdbStore(dbName());
      } catch {
        return new MemoryStore();
      }
    })();
  }
  return storePromise;
}

/** Ask the browser not to evict our data (Safari can wipe sites not on the Home Screen). */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isPersisted(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}

export function validateBackup(x: unknown): x is BackupFile {
  if (!x || typeof x !== 'object') return false;
  const b = x as BackupFile;
  if (b.app !== 'maths-practice' || b.version !== 1 || !b.stores) return false;
  const s = b.stores;
  return ['attempts', 'drafts', 'cards', 'sets', 'settings'].every((k) => Array.isArray((s as unknown as Record<string, unknown>)[k]));
}

export async function downloadBackup(): Promise<string> {
  const store = await getStore();
  const data = await store.exportAll();
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const name = `maths-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  await store.putSetting('lastBackup', Date.now());
  return name;
}

export async function restoreBackup(file: File, mode: 'replace' | 'merge'): Promise<{ attempts: number }> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!validateBackup(data)) throw new Error('That file is not a Maths Practice backup.');
  const store = await getStore();
  await store.importAll(data, mode);
  return { attempts: data.stores.attempts.length };
}

export type { Store } from './types';
