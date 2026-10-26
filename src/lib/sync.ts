/**
 * Keeping a signed-in person's progress the same on all their devices (cloud.ts). A sync pulls their
 * saved snapshot, merges it into this device's copy (sync-merge.ts: nothing is ever lost), then
 * saves the result with the version it pulled — if another device saved in between, it pulls,
 * merges and tries again. It also shares a small summary with the study group.
 */
import { getStore } from '../storage';
import type { Store } from '../storage/types';
import { notifyProgress, onProgressChange } from '../progress/record';
import { applySyncedPrefs, onSettingsChange, readSettings, syncedPrefs, type SyncedPrefs } from './settings';
import { CloudError, cloudMe, onCloudMe, pullProgress, pushProgress, refreshMe, shareActivity, type GroupSummary } from './cloud';
import { buildActivity } from './activity';
import { incoming, isEmpty, outgoing, type Snapshot } from './sync-merge';
import type { PaperResults } from './paper-results';
import { NOTES_KEY, type MistakeNotes } from './mistakes';
import { TOPICS_KEY, type TopicMarks } from './topics';
import { streak, thisWeek } from './streak';
import { scoreOf } from '../progress/mastery';
import { earned } from './badges';

// ---------------------------------------------------------------- compact storage
const enc = new TextEncoder();
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}
function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** base64( version 2 | flag (1 = gzip) | body ) */
export async function pack(text: string): Promise<string> {
  const gzip = typeof CompressionStream !== 'undefined';
  const body = gzip ? await pipe(enc.encode(text), new CompressionStream('gzip')) : enc.encode(text);
  const out = new Uint8Array(body.length + 2);
  out[0] = 2;
  out[1] = gzip ? 1 : 0;
  out.set(body, 2);
  return toBase64(out);
}
export async function unpack(data: string): Promise<string> {
  const bytes = fromBase64(data);
  if (bytes[0] !== 2) throw new Error('This saved progress was made by a newer version of the app — update this device');
  const body = bytes.subarray(2);
  if (bytes[1] === 1) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to sync — update it');
    return new TextDecoder().decode(await pipe(body, new DecompressionStream('gzip')));
  }
  return new TextDecoder().decode(body);
}

// ---------------------------------------------------------------- what is saved
interface Payload {
  app: 'maths-practice';
  kind: 'sync';
  version: 1;
  savedAt: number;
  stores: Snapshot;
  /** preferences that follow the person, with when they last changed */
  prefs?: { values: SyncedPrefs; at: number };
  /** marks entered for real past papers */
  papers?: PaperResults;
  /** notes and reasons in the mistake notebook */
  notes?: MistakeNotes;
  /** topics marked to learn or for help, with your notes and links */
  topics?: TopicMarks;
}

/** What admins see of you (the study group leaderboard). */
export function summarise(s: Snapshot, now = new Date(), papers: PaperResults = {}): GroupSummary {
  return {
    attempts: s.attempts.length,
    marks: s.attempts.reduce((t, a) => t + a.marks, 0),
    scored: s.attempts.reduce((t, a) => t + scoreOf(a), 0),
    lastActive: s.attempts.reduce((t, a) => Math.max(t, a.finishedAt), 0),
    week: thisWeek(s.attempts, now),
    streak: streak(s.attempts, now),
    badges: earned({ attempts: s.attempts, sets: s.sets, papers }).length,
  };
}

/** Records kept by id from two devices (past-paper marks, mistake notes): per id, the most recently changed. */
export function mergeNewest<T extends { updatedAt: number }>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [id, r] of Object.entries(b)) if (!out[id] || r.updatedAt > out[id].updatedAt) out[id] = r;
  return out;
}
export const mergePapers = (a: PaperResults, b: PaperResults): PaperResults => mergeNewest(a, b);

/** Merge a by-id setting with the other device's copy; true if this device's copy changed. */
async function mergeSetting<T extends { updatedAt: number }>(store: Store, key: string, remote: Record<string, T> | undefined): Promise<[Record<string, T>, boolean]> {
  const local = await store.getSetting<Record<string, T>>(key, {});
  const merged = mergeNewest(local, remote ?? {});
  if (JSON.stringify(merged) === JSON.stringify(local)) return [merged, false];
  await store.putSetting(key, merged);
  return [merged, true];
}

const PAPERS_KEY = 'pastPaperResults';

async function localSnapshot(store: Store): Promise<Snapshot> {
  const { attempts, drafts, cards, sets } = (await store.exportAll()).stores;
  return { attempts, drafts, cards, sets };
}

async function apply(store: Store, remote: Snapshot): Promise<boolean> {
  const c = incoming(await localSnapshot(store), remote);
  if (isEmpty(c)) return false;
  for (const a of c.addAttempts) await store.addAttempt(a);
  for (const a of c.updateAttempts) await store.updateAttempt(a);
  for (const d of c.putDrafts) await store.putDraft(d);
  for (const k of c.deleteDrafts) await store.deleteDraft(k);
  for (const x of c.putCards) await store.putCard(x);
  for (const s of c.putSets) await store.putSet(s);
  return true;
}

// ---------------------------------------------------------------- status (for the account page)
export interface SyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'error';
  message: string;
  lastSync: number;
  /** the sign-in has expired: ask for the password again */
  expired?: boolean;
}
const LAST_KEY = 'mp.sync.last';
const readLast = () => {
  try {
    return Number(localStorage.getItem(LAST_KEY)) || 0;
  } catch {
    return 0;
  }
};
let status: SyncStatus = { state: 'idle', message: '', lastSync: readLast() };
const listeners = new Set<(s: SyncStatus) => void>();
function setStatus(p: Partial<SyncStatus>) {
  status = { ...status, ...p };
  listeners.forEach((f) => f(status));
}
export const syncStatus = () => status;
export function onSyncStatus(f: (s: SyncStatus) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

// ---------------------------------------------------------------- one sync
export const MAX_SYNC_CHARS = 1_900_000;
/** set while announcing synced-in progress, so that doesn't schedule another sync */
let quiet = false;
let running: Promise<void> | null = null;

/** Pull, merge and save now. Resolves when done; rejects with a readable message. */
export function syncNow(): Promise<void> {
  if (!running)
    running = run().finally(() => {
      running = null;
    });
  return running;
}

async function run(): Promise<void> {
  if (!cloudMe()) return setStatus({ state: 'off', message: '' });
  setStatus({ state: 'syncing', message: 'Saving…', expired: false });
  try {
    await refreshMe();
    const store = await getStore();
    let changed = false;
    for (let tries = 0; ; tries++) {
      const got = await pullProgress();
      const remote = got.data ? (JSON.parse(await unpack(got.data)) as Payload) : null;
      if (remote && (await apply(store, remote.stores))) changed = true;
      if (remote?.prefs && applySyncedPrefs(remote.prefs.values, remote.prefs.at)) changed = true;
      const [papers, papersChanged] = await mergeSetting(store, PAPERS_KEY, remote?.papers);
      const [notes, notesChanged] = await mergeSetting(store, NOTES_KEY, remote?.notes);
      const [topics, topicsChanged] = await mergeSetting(store, TOPICS_KEY, remote?.topics);
      if (papersChanged || notesChanged || topicsChanged) changed = true;
      const prefs = { values: syncedPrefs(), at: readSettings().prefsAt };
      const snapshot = await localSnapshot(store);
      const out = outgoing(snapshot);
      if (remote && JSON.stringify([out, prefs, papers, notes, topics]) === JSON.stringify([outgoing(remote.stores), remote.prefs ?? null, remote.papers ?? {}, remote.notes ?? {}, remote.topics ?? {}])) break;
      const payload: Payload = { app: 'maths-practice', kind: 'sync', version: 1, savedAt: Date.now(), stores: out, prefs, papers, notes, topics };
      const data = await pack(JSON.stringify(payload));
      if (data.length > MAX_SYNC_CHARS) throw new Error('Your progress is too big to save online — back it up to a file instead');
      if (await pushProgress(got.v, data, summarise(snapshot, new Date(), papers))) break;
      if (tries >= 3) throw new Error('Another device keeps saving at the same time — try again in a moment');
    }
    if (changed) {
      quiet = true;
      notifyProgress();
      quiet = false;
    }
    void shareActivityIfChanged(store);
    const now = Date.now();
    try {
      localStorage.setItem(LAST_KEY, String(now));
    } catch {
      /* private mode */
    }
    setStatus({ state: 'idle', message: changed ? 'Saved — progress from your other devices added' : 'Saved to your account', lastSync: now });
  } catch (e) {
    const expired = e instanceof CloudError && e.status === 401;
    setStatus({ state: 'error', message: e instanceof Error ? e.message : 'Couldn’t save', expired });
    throw e;
  }
}

/** Admins see a summary of each person's work: send it when it has changed (never blocks saving). */
async function shareActivityIfChanged(store: Store): Promise<void> {
  try {
    const me = cloudMe();
    if (!me) return;
    const detail = buildActivity(await localSnapshot(store), await store.getSetting<PaperResults>(PAPERS_KEY, {}), new Date(), await store.getSetting<TopicMarks>(TOPICS_KEY, {}));
    const key = `mp.activity.sent:${me.id}`;
    const fingerprint = JSON.stringify({ ...detail, updatedAt: 0 });
    if (localStorage.getItem(key) === fingerprint) return;
    await shareActivity(detail);
    localStorage.setItem(key, fingerprint);
  } catch {
    /* offline, or the table isn't there yet: try again next time */
  }
}

// ---------------------------------------------------------------- automatic sync
let started = false;

/** Sync on start, a little after progress or preferences change, and when the device comes back online. */
export function startAutoSync(): void {
  if (started) return;
  started = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const soon = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (cloudMe()) syncNow().catch(() => {});
    }, ms);
  };
  soon(1500);
  onProgressChange(() => {
    if (!quiet) soon(8000);
  });
  onSettingsChange((n, old) => {
    if (n.prefsAt !== old.prefsAt && !quiet) soon(8000);
  });
  onCloudMe(() => soon(500));
  window.addEventListener('online', () => soon(2000));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - status.lastSync > 2 * 60_000) soon(500);
    // leaving the app: save what's waiting now rather than in a few seconds
    if (document.visibilityState === 'hidden' && timer) soon(0);
  });
}
