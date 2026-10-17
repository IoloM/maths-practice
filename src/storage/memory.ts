import type { Attempt, BackupFile, CardRecord, Draft, SetRecord, Store } from './types';

/** In-memory store: fallback when IndexedDB is unavailable, and for tests. */
export class MemoryStore implements Store {
  readonly kind = 'memory' as const;
  private attempts: Attempt[] = [];
  private nextId = 1;
  private drafts = new Map<string, Draft>();
  private cards = new Map<string, CardRecord>();
  private sets = new Map<string, SetRecord>();
  private settings = new Map<string, unknown>();
  async addAttempt(a: Attempt) {
    const id = this.nextId++;
    this.attempts.push({ ...structuredClone(a), id });
    return id;
  }
  async updateAttempt(a: Attempt) {
    const i = this.attempts.findIndex((x) => x.id === a.id);
    if (i >= 0) this.attempts[i] = structuredClone(a);
  }
  async allAttempts() {
    return [...this.attempts].sort((a, b) => a.finishedAt - b.finishedAt).map((a) => structuredClone(a));
  }
  async attemptsFor(templateId: string) {
    return this.attempts.filter((a) => a.templateId === templateId).map((a) => structuredClone(a));
  }
  async getDraft(key: string) {
    return this.drafts.get(key);
  }
  async putDraft(d: Draft) {
    this.drafts.set(d.key, structuredClone(d));
  }
  async deleteDraft(key: string) {
    this.drafts.delete(key);
  }
  async getCard(f: string) {
    return this.cards.get(f);
  }
  async putCard(c: CardRecord) {
    this.cards.set(c.family, structuredClone(c));
  }
  async allCards() {
    return [...this.cards.values()];
  }
  async getSet(id: string) {
    return this.sets.get(id);
  }
  async putSet(s: SetRecord) {
    this.sets.set(s.id, structuredClone(s));
  }
  async allSets() {
    return [...this.sets.values()];
  }
  async getSetting<T>(key: string, fallback: T) {
    return this.settings.has(key) ? (this.settings.get(key) as T) : fallback;
  }
  async putSetting(key: string, value: unknown) {
    this.settings.set(key, value);
  }
  async exportAll(): Promise<BackupFile> {
    return {
      app: 'maths-practice',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        attempts: await this.allAttempts(),
        drafts: [...this.drafts.values()],
        cards: [...this.cards.values()],
        sets: [...this.sets.values()],
        settings: [...this.settings.entries()].map(([key, value]) => ({ key, value })),
      },
    };
  }
  async clearAll() {
    this.attempts = [];
    this.drafts.clear();
    this.cards.clear();
    this.sets.clear();
    this.settings.clear();
  }
  async importAll(b: BackupFile, mode: 'replace' | 'merge') {
    if (mode === 'replace') {
      this.attempts = [];
      this.drafts.clear();
      this.cards.clear();
      this.sets.clear();
      this.settings.clear();
    }
    const seen = new Set(this.attempts.map((a) => `${a.templateId}:${a.seed}:${a.finishedAt}`));
    for (const a of b.stores.attempts) if (!seen.has(`${a.templateId}:${a.seed}:${a.finishedAt}`)) await this.addAttempt(a);
    for (const d of b.stores.drafts) this.drafts.set(d.key, d);
    for (const c of b.stores.cards) this.cards.set(c.family, c);
    for (const s of b.stores.sets) this.sets.set(s.id, s);
    for (const s of b.stores.settings) this.settings.set(s.key, s.value);
  }
}
