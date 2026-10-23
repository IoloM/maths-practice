/**
 * Cross-device sync, end-to-end encrypted. A sync code (100 random bits, shown once and typed on the
 * other device) gives both the row id (a SHA-256 hash) and the AES-GCM key (PBKDF2); the server only
 * ever sees ciphertext. A sync pulls, merges (sync-merge.ts), then pushes with the version it pulled,
 * retrying if another device got there first.
 */
import { getStore } from '../storage';
import type { Store } from '../storage/types';
import { notifyProgress, onProgressChange } from '../progress/record';
import { ApiError, apiBase, request } from './api';
import { readSettings } from './settings';
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

/** base64( version 1 | iv (12) | AES-GCM( flag (1 = gzip) | body ) ) */
export async function seal(key: CryptoKey, text: string): Promise<string> {
  const gzip = typeof CompressionStream !== 'undefined';
  const body = gzip ? await pipe(enc.encode(text), new CompressionStream('gzip')) : enc.encode(text);
  const plain = new Uint8Array(body.length + 1);
  plain[0] = gzip ? 1 : 0;
  plain.set(body, 1);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
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
  const body = plain.subarray(1);
  if (plain[0] === 1) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old to sync — update it');
    return new TextDecoder().decode(await pipe(body, new DecompressionStream('gzip')));
  }
  return new TextDecoder().decode(body);
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
  if (!s.syncCode || !base) return setStatus({ state: 'off', message: '' });
  setStatus({ state: 'syncing', message: 'Syncing…' });
  try {
    const { id, key } = await syncKeys(s.syncCode);
    const store = await getStore();
    let changed = false;
    for (let tries = 0; ; tries++) {
      const got = await request<{ v: number; data?: string }>(`/sync/${id}`, { base, ok: [200, 404] });
      const remoteText = got.body.data ? await open(key, got.body.data) : null;
      const remote = remoteText ? (JSON.parse(remoteText) as Payload).stores : null;
      if (remote && (await apply(store, remote))) changed = true;
      const out = outgoing(await localSnapshot(store));
      if (remote && JSON.stringify(out) === JSON.stringify(outgoing(remote))) break;
      const payload: Payload = { app: 'maths-practice', kind: 'sync', version: 1, savedAt: Date.now(), stores: out };
      const data = await seal(key, JSON.stringify(payload));
      if (data.length > MAX_SYNC_CHARS) throw new Error('Your progress is too big to sync — back it up to a file instead');
      const put = await request<{ v: number }>(`/sync/${id}`, { base, method: 'PUT', body: JSON.stringify({ base: got.body.v ?? 0, data }), ok: [200, 409] });
      if (put.status === 200) break;
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
    setStatus({ state: 'idle', message: changed ? 'Synced — progress from your other devices added' : 'Synced', lastSync: now });
  } catch (e) {
    setStatus({ state: 'error', message: e instanceof ApiError || e instanceof Error ? e.message : 'Sync failed' });
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
      if (readSettings().syncCode && apiBase()) syncNow().catch(() => {});
    }, ms);
  };
  soon(3000);
  onProgressChange(() => {
    if (!quiet) soon(15_000);
  });
  window.addEventListener('online', () => soon(2000));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - status.lastSync > 5 * 60_000) soon(1000);
  });
}
