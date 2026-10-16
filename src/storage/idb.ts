import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Attempt, BackupFile, CardRecord, Draft, SetRecord, Setting, Store } from './types';

interface Schema extends DBSchema {
  attempts: { key: number; value: Attempt; indexes: { templateId: string; family: string; finishedAt: number } };
  drafts: { key: string; value: Draft };
  cards: { key: string; value: CardRecord };
  sets: { key: string; value: SetRecord };
  settings: { key: string; value: Setting };
}

export const DB_NAME = 'maths-practice';
const STORES = ['attempts', 'drafts', 'cards', 'sets', 'settings'] as const;

export async function openIdbStore(name = DB_NAME): Promise<Store> {
  const db = await openDB<Schema>(name, 1, {
    upgrade(db) {
      const a = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
      a.createIndex('templateId', 'templateId');
      a.createIndex('family', 'family');
      a.createIndex('finishedAt', 'finishedAt');
      db.createObjectStore('drafts', { keyPath: 'key' });
      db.createObjectStore('cards', { keyPath: 'family' });
      db.createObjectStore('sets', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });
  return new IdbStore(db);
}

class IdbStore implements Store {
  readonly kind = 'indexeddb' as const;
  constructor(private db: IDBPDatabase<Schema>) {}
  async addAttempt(a: Attempt) {
    const { id: _id, ...rest } = a;
    return (await this.db.add('attempts', rest as Attempt)) as number;
  }
  async updateAttempt(a: Attempt) {
    await this.db.put('attempts', a);
  }
  allAttempts() {
    return this.db.getAllFromIndex('attempts', 'finishedAt');
  }
  attemptsFor(templateId: string) {
    return this.db.getAllFromIndex('attempts', 'templateId', templateId);
  }
  getDraft(key: string) {
    return this.db.get('drafts', key);
  }
  async putDraft(d: Draft) {
    await this.db.put('drafts', d);
  }
  async deleteDraft(key: string) {
    await this.db.delete('drafts', key);
  }
  getCard(family: string) {
    return this.db.get('cards', family);
  }
  async putCard(c: CardRecord) {
    await this.db.put('cards', c);
  }
  allCards() {
    return this.db.getAll('cards');
  }
  getSet(id: string) {
    return this.db.get('sets', id);
  }
  async putSet(s: SetRecord) {
    await this.db.put('sets', s);
  }
  allSets() {
    return this.db.getAll('sets');
  }
  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const s = await this.db.get('settings', key);
    return s ? (s.value as T) : fallback;
  }
  async putSetting(key: string, value: unknown) {
    await this.db.put('settings', { key, value });
  }
  async exportAll(): Promise<BackupFile> {
    const [attempts, drafts, cards, sets, settings] = await Promise.all([
      this.db.getAll('attempts'),
      this.db.getAll('drafts'),
      this.db.getAll('cards'),
      this.db.getAll('sets'),
      this.db.getAll('settings'),
    ]);
    return { app: 'maths-practice', version: 1, exportedAt: new Date().toISOString(), stores: { attempts, drafts, cards, sets, settings } };
  }
  async importAll(b: BackupFile, mode: 'replace' | 'merge') {
    const tx = this.db.transaction(STORES, 'readwrite');
    if (mode === 'replace') for (const s of STORES) await tx.objectStore(s).clear();
    const existing = mode === 'merge' ? new Set((await tx.objectStore('attempts').getAll()).map((a) => `${a.templateId}:${a.seed}:${a.finishedAt}`)) : new Set<string>();
    for (const a of b.stores.attempts) {
      const key = `${a.templateId}:${a.seed}:${a.finishedAt}`;
      if (existing.has(key)) continue;
      const { id: _id, ...rest } = a;
      await tx.objectStore('attempts').add((mode === 'replace' && a.id !== undefined ? a : rest) as Attempt);
    }
    for (const d of b.stores.drafts) await tx.objectStore('drafts').put(d);
    for (const c of b.stores.cards) await tx.objectStore('cards').put(c);
    for (const s of b.stores.sets) await tx.objectStore('sets').put(s);
    for (const s of b.stores.settings) await tx.objectStore('settings').put(s);
    await tx.done;
  }
}
