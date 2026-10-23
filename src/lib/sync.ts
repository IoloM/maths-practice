/**
 * Cross-device sync: to the signed-in account (account.ts), or, without a login, end-to-end encrypted
 * with a sync code. A sync code (100 random bits, shown once and typed on the
 * other device) gives both the row id (a SHA-256 hash) and the AES-GCM key (PBKDF2); the server only
 * ever sees ciphertext. A sync pulls, merges (sync-merge.ts), then pushes with the version it pulled,
 * retrying if another device got there first.
 */
import { getStore } from '../storage';
import type { Store } from '../storage/types';
import { notifyProgress, onProgressChange } from '../progress/record';
import { ApiError, apiBase, request } from './api';
import { applySyncedPrefs, onSettingsChange, readSettings, syncedPrefs, type SyncedPrefs } from './settings';
import { authHeader, forgetAccount, onAccountChange, readAccount, updateUser, type AccountUser } from './account';
import { effectiveScore } from './score';
import { incoming, isEmpty, outgoing, type Snapshot } from './sync-merge';

// ---------------------------------------------------------------- the sync code
/** No 0/O or 1/I, so a code read off one screen is typed correctly on another. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LEN = 20;

export function newSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LEN));
  return formatCode(Array.from(bytes, (b) => ALPHABET[b & 31]).join(''));
}
const formatCode = (raw: string) => raw.match(/.{1,4}/g)!.join('-');

/** A typed code tidied up (case, spaces, dashes), or null if it can't be a sync code. */
export function normaliseCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]/g, '');
  if (raw.length !== CODE_LEN || [...raw].some((c) => !ALPHABET.includes(c))) return null;
  return formatCode(raw);
}

// ---------------------------------------------------------------- keys and encryption
const enc = new TextEncoder();
const keyCache = new Map<string, Promise<{ id: string; key: CryptoKey }>>();

export function syncKeys(code: string): Promise<{ id: string; key: CryptoKey }> {
  let p = keyCache.get(code);
  if (!p) {
    p = (async () => {
      const raw = enc.encode(code.replace(/-/g, ''));
      const digest = await crypto.subtle.digest('SHA-256', enc.encode(`maths-practice sync id v1:${code.replace(/-/g, '')}`));
      const id = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
      const base = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('maths-practice sync key v1'), iterations: 200_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      return { id, key };
    })();
    keyCache.set(code, p);
  }
  return p;
}

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

async function compress(text: string): Promise<Uint8Array> {
  const gzip = typeof CompressionStream !== 'undefined';
  const body = gzip ? await pipe(enc.encode(text), new CompressionStream('gzip')) : enc.encode(text);
  const out = new Uint8Array(body.length + 1);
  out[0] = gzip ? 1 : 0;
  out.set(body, 1);
  return out;
}
async function decompress(plain: Uint8Array): Promise<string> {
  const body = plain.subarray(1);
  if (plain[0] === 1) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to sync — update it');
    return new TextDecoder().decode(await pipe(body, new DecompressionStream('gzip')));
  }
  return new TextDecoder().decode(body);
}

/** Sync code: base64( version 1 | iv (12) | AES-GCM( flag (1 = gzip) | body ) ) */
export async function seal(key: CryptoKey, text: string): Promise<string> {
  const plain = await compress(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain as BufferSource));
  const out = new Uint8Array(13 + ct.length);
  out[0] = 1;
  out.set(iv, 1);
  out.set(ct, 13);
  return toBase64(out);
}

export async function open(key: CryptoKey, data: string): Promise<string> {
  const bytes = fromBase64(data);
  if (bytes[0] !== 1) throw new Error('This sync data was made by a newer version of the app — update this device');
  let plain: Uint8Array;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(1, 13) }, key, bytes.subarray(13)));
  } catch {
    throw new Error('Could not unlock the synced progress — check the sync code');
  }
  return decompress(plain);
}

/** Account: base64( version 2 | flag (1 = gzip) | body ) — private to the login, so not encrypted again. */
export async function pack(text: string): Promise<string> {
  const c = await compress(text);
  const out = new Uint8Array(c.length + 1);
  out[0] = 2;
  out.set(c, 1);
  return toBase64(out);
}

export async function unpack(data: string): Promise<string> {
  const bytes = fromBase64(data);
  if (bytes[0] !== 2) throw new Error('This saved progress was made by a newer version of the app — update this device');
  return decompress(bytes.subarray(1));
}

// ---------------------------------------------------------------- status (for the Settings page)
export interface SyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'error';
  message: string;
  lastSync: number;
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
interface Payload {
  app: 'maths-practice';
  kind: 'sync';
  version: 1;
  savedAt: number;
  stores: Snapshot;
  /** preferences that follow the person, with when they last changed */
  prefs?: { values: SyncedPrefs; at: number };
}

/** For the admin's list of logins. */
export interface Summary {
  attempts: number;
  marks: number;
  scored: number;
  lastActive: number;
}
export function summarise(s: Snapshot): Summary {
  let marks = 0,
    scored = 0,
    lastActive = 0;
  for (const a of s.attempts) {
    marks += a.marks;
    scored += a.parts.reduce((t, p) => t + effectiveScore(p), 0);
    lastActive = Math.max(lastActive, a.finishedAt);
  }
  return { attempts: s.attempts.length, marks, scored, lastActive };
}

/** Where progress is kept: the signed-in account, or the row a sync code points at. */
interface Target {
  get(): Promise<{ v: number; text: string | null }>;
  /** false: another device saved first */
  put(base: number, text: string, summary: Summary): Promise<boolean>;
}

function accountTarget(base: string): Target {
  return {
    async get() {
      const { body } = await request<{ v: number; data?: string; user?: AccountUser }>('/me', { base, headers: authHeader() });
      if (body.user) updateUser(body.user);
      return { v: body.v, text: body.data ? await unpack(body.data) : null };
    },
    async put(v, text, summary) {
      const data = await pack(text);
      if (data.length > MAX_SYNC_CHARS) throw new Error('Your progress is too big to save — back it up to a file instead');
      const r = await request('/me', { base, method: 'PUT', headers: authHeader(), body: JSON.stringify({ base: v, data, summary }), ok: [200, 409] });
      return r.status === 200;
    },
  };
}

async function codeTarget(base: string, code: string): Promise<Target> {
  const { id, key } = await syncKeys(code);
  return {
    async get() {
      const { body } = await request<{ v: number; data?: string }>(`/sync/${id}`, { base, ok: [200, 404] });
      return { v: body.v ?? 0, text: body.data ? await open(key, body.data) : null };
    },
    async put(v, text) {
      const data = await seal(key, text);
      if (data.length > MAX_SYNC_CHARS) throw new Error('Your progress is too big to sync — back it up to a file instead');
      const r = await request(`/sync/${id}`, { base, method: 'PUT', body: JSON.stringify({ base: v, data }), ok: [200, 409] });
      return r.status === 200;
    },
  };
}

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

export const MAX_SYNC_CHARS = 1_500_000;
/** set while announcing synced-in progress, so that doesn't schedule another sync */
let quiet = false;
let running: Promise<void> | null = null;

/** Is there anywhere to sync to? */
export const syncConfigured = () => !!apiBase() && (!!readAccount() || !!readSettings().syncCode);

/** Pull, merge and push now. Resolves when done; rejects with a readable message. */
export function syncNow(): Promise<void> {
  if (!running)
    running = run().finally(() => {
      running = null;
    });
  return running;
}

async function run(): Promise<void> {
  const s = readSettings();
  const base = apiBase(s);
  const account = readAccount();
  if (!base || (!account && !s.syncCode)) return setStatus({ state: 'off', message: '' });
  setStatus({ state: 'syncing', message: account ? 'Saving to your account…' : 'Syncing…' });
  try {
    const target = account ? accountTarget(base) : await codeTarget(base, s.syncCode);
    const store = await getStore();
    let changed = false;
    for (let tries = 0; ; tries++) {
      const got = await target.get();
      const remote = got.text ? (JSON.parse(got.text) as Payload) : null;
      if (remote && (await apply(store, remote.stores))) changed = true;
      if (remote?.prefs && applySyncedPrefs(remote.prefs.values, remote.prefs.at)) changed = true;
      const prefs = { values: syncedPrefs(), at: readSettings().prefsAt };
      const snapshot = await localSnapshot(store);
      const out = outgoing(snapshot);
      if (remote && JSON.stringify([out, prefs]) === JSON.stringify([outgoing(remote.stores), remote.prefs ?? null])) break;
      const payload: Payload = { app: 'maths-practice', kind: 'sync', version: 1, savedAt: Date.now(), stores: out, prefs };
      if (await target.put(got.v, JSON.stringify(payload), summarise(snapshot))) break;
      if (tries >= 3) throw new Error('Another device keeps syncing at the same time — try again in a moment');
    }
    if (changed) {
      quiet = true;
      notifyProgress();
      quiet = false;
    }
    const now = Date.now();
    try {
      localStorage.setItem(LAST_KEY, String(now));
    } catch {
      /* private mode */
    }
    const where = account ? 'Saved to your account' : 'Synced';
    setStatus({ state: 'idle', message: changed ? `${where} — progress from your other devices added` : where, lastSync: now });
  } catch (e) {
    if (account && e instanceof ApiError && e.status === 401) {
      // the sign-in expired or the login was switched off: keep this device's progress, ask to sign in again
      forgetAccount();
      setStatus({ state: 'error', message: `${e.message}. Your progress on this device is kept.` });
    } else setStatus({ state: 'error', message: e instanceof ApiError || e instanceof Error ? e.message : 'Sync failed' });
    throw e;
  }
}

// ---------------------------------------------------------------- automatic sync
let started = false;

/** Sync on start, a little after progress changes, and when the device comes back online. */
export function startAutoSync(): void {
  if (started) return;
  started = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const soon = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (syncConfigured()) syncNow().catch(() => {});
    }, ms);
  };
  soon(3000);
  onProgressChange(() => {
    if (!quiet) soon(15_000);
  });
  onSettingsChange((n, old) => {
    if (n.prefsAt !== old.prefsAt && !quiet) soon(15_000);
  });
  onAccountChange(() => soon(500));
  window.addEventListener('online', () => soon(2000));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - status.lastSync > 5 * 60_000) soon(1000);
  });
}
