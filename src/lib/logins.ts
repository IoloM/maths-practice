/**
 * Who is using the app on this device, and so which local copy of progress and settings to open.
 *
 * With Supabase set up (cloud.ts), logins are made by an admin in the app and work on every device;
 * each person's progress is kept on Supabase and in their own local database here. Without it,
 * logins live on the device they were made on (the registry below): an admin makes them here, or
 * sends a setup link that makes the login on the person's own phone or tablet.
 *
 * Passwords are stored as salted PBKDF2 hashes. Logins keep people's work apart; they are not
 * encryption — the data itself sits unencrypted in the browser like any website's.
 */
import { openIdbStore } from '../storage/idb';
import { cloudConfigured, cloudMe } from './cloud';

export interface Login {
  id: string;
  username: string;
  name: string;
  admin: boolean;
  /** p1$<iterations>$<salt>$<hash>, base64 */
  pass: string;
  /** made with a temporary password: choose your own at first sign-in */
  mustChange: boolean;
  createdAt: number;
  /** where this person's progress and settings live */
  db: string;
  settings: string;
}

interface Registry {
  users: Login[];
  current: string | null;
}

const KEY = 'mp.logins.v1';
/** The first login on a device takes over what was already there (the progress made before logins). */
export const DEFAULT_DB = 'maths-practice';
export const DEFAULT_SETTINGS = 'mp.settings.v1';
export const USERNAME = /^[a-z0-9]([a-z0-9._-]{0,30}[a-z0-9])?$/;
export const MIN_PASSWORD = 4;
const ITERATIONS = 100_000;

let reg: Registry | undefined;
function registry(): Registry {
  if (!reg) {
    try {
      reg = JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? { users: [], current: null };
    } catch {
      reg = { users: [], current: null };
    }
  }
  return reg!;
}
function save(r: Registry) {
  reg = r;
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* private mode: logins last until the tab closes */
  }
}

/** Logins work on every device (Supabase), rather than on this device only. */
export const cloudMode = cloudConfigured;

/** The signed-in Supabase login, in the shape the rest of the app uses. */
function cloudLogin(): Login | null {
  const m = cloudMe();
  return m ? { id: `c-${m.id}`, username: m.username, name: m.name, admin: m.admin, pass: '', mustChange: m.mustChange, createdAt: 0, db: `${DEFAULT_DB}-c-${m.id}`, settings: `${DEFAULT_SETTINGS}:c-${m.id}` } : null;
}
/** Logins made on this device before logins went online (kept until each person moves across). */
export const deviceLogins = (): Login[] => registry().users;

export const allLogins = (): Login[] => [...registry().users].sort((a, b) => a.name.localeCompare(b.name));
export const loginsEnabled = () => cloudMode || registry().users.length > 0;
export const currentLogin = (): Login | null => (cloudMode ? cloudLogin() : (registry().users.find((u) => u.id === registry().current) ?? null));
/**
 * Show only the sign-in screen, not anyone's progress: device logins are set up and nobody is signed
 * in. (With online logins, someone without a login can still practise as a guest on a device
 * nobody has made logins on.)
 */
/** With online logins, someone not signed in is a guest: nothing they do is saved (see storage). */
export const GUEST_DB = 'memory';
export const isGuest = () => cloudMode && !currentLogin();
/** On a device with device logins, a guest chose "Use without an account" for this visit. */
export const guestChosen = () => {
  try {
    return sessionStorage.getItem('mp.guest') === '1';
  } catch {
    return false;
  }
};
export function chooseGuest() {
  try {
    sessionStorage.setItem('mp.guest', '1');
  } catch {
    /* private mode */
  }
}
export const needsSignIn = () => !currentLogin() && registry().users.length > 0 && !(cloudMode && guestChosen());
export const dbName = () => currentLogin()?.db ?? (cloudMode ? GUEST_DB : registry().users.length ? 'maths-practice-signed-out' : DEFAULT_DB);
export const settingsKey = () => currentLogin()?.settings ?? DEFAULT_SETTINGS;
export const normaliseUsername = (u: string) => u.trim().toLowerCase();

// ---------------------------------------------------------------- passwords
const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));

async function pbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' }, key, 256));
}
export async function hashPassword(password: string): Promise<string> {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  return `p1$${ITERATIONS}$${salt}$${await pbkdf2(password, salt, ITERATIONS)}`;
}
export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, salt, hash] = stored.split('$');
  if (kind !== 'p1' || !salt || !hash) return false;
  return (await pbkdf2(password, salt, Number(n))) === hash;
}

/** A temporary password to read out or text: three groups of four, no look-alike characters. */
export function tempPassword(): string {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => a[x % a.length])
    .join('')
    .match(/.{4}/g)!
    .join('-');
}

// ---------------------------------------------------------------- setting up and signing in
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function checkNew(username: string, name: string) {
  if (!name.trim()) throw new Error('Enter a name.');
  if (!USERNAME.test(username)) throw new Error('Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
  if (registry().users.some((u) => u.username === username)) throw new Error(`There's already a login called "${username}" on this device.`);
}
function checkPasswordRule(password: string) {
  if (password.length < MIN_PASSWORD) throw new Error(`Use at least ${MIN_PASSWORD} characters.`);
}

async function create(p: { name: string; username: string; password: string; admin: boolean; mustChange: boolean; signIn: boolean }): Promise<Login> {
  const username = normaliseUsername(p.username);
  checkNew(username, p.name);
  const r = registry();
  const first = !r.users.length;
  const id = newId();
  const login: Login = {
    id,
    username,
    name: p.name.trim().slice(0, 60),
    admin: p.admin || first,
    pass: await hashPassword(p.password),
    mustChange: p.mustChange,
    createdAt: Date.now(),
    db: first ? DEFAULT_DB : `maths-practice-${id}`,
    settings: first ? DEFAULT_SETTINGS : `${DEFAULT_SETTINGS}:${id}`,
  };
  save({ users: [...r.users, login], current: p.signIn ? id : r.current });
  return login;
}

/** Turn logins on: your own admin login, which keeps the progress already on this device. */
export async function setUpFirstLogin(p: { name: string; username: string; password: string }): Promise<Login> {
  if (loginsEnabled()) throw new Error('Logins are already set up on this device.');
  checkPasswordRule(p.password);
  return create({ ...p, admin: true, mustChange: false, signIn: true });
}

function requireAdmin(): Login {
  const me = currentLogin();
  if (!me?.admin) throw new Error('Only an admin can manage logins.');
  return me;
}

/** An admin makes a login for someone; returns their temporary password. */
export async function addLogin(p: { name: string; username: string; admin: boolean }): Promise<{ login: Login; password: string }> {
  requireAdmin();
  const password = tempPassword();
  const login = await create({ ...p, password, mustChange: true, signIn: false });
  return { login, password };
}

export async function findForSignIn(username: string, password: string): Promise<Login> {
  const u = registry().users.find((x) => x.username === normaliseUsername(username));
  if (!u || !(await checkPassword(password, u.pass))) throw new Error('Wrong username or password.');
  return u;
}

/** Sign in (after a temporary password, `newPassword` replaces it). Reload the page afterwards. */
export async function signIn(username: string, password: string, newPassword?: string): Promise<void> {
  const u = await findForSignIn(username, password);
  const r = registry();
  let users = r.users;
  if (newPassword !== undefined) {
    checkPasswordRule(newPassword);
    const pass = await hashPassword(newPassword);
    users = users.map((x) => (x.id === u.id ? { ...x, pass, mustChange: false } : x));
  }
  save({ users, current: u.id });
}

/** Back to the sign-in screen. Reload the page afterwards. */
export function signOut() {
  save({ ...registry(), current: null });
}

export async function changePassword(current: string, next: string): Promise<void> {
  const me = currentLogin();
  if (!me) throw new Error('Sign in first.');
  if (!(await checkPassword(current, me.pass))) throw new Error('Your current password is wrong.');
  checkPasswordRule(next);
  const pass = await hashPassword(next);
  const r = registry();
  save({ ...r, users: r.users.map((x) => (x.id === me.id ? { ...x, pass, mustChange: false } : x)) });
}

function updateUser(id: string, f: (u: Login) => Login) {
  const r = registry();
  save({ ...r, users: r.users.map((x) => (x.id === id ? f(x) : x)) });
}

/** A new temporary password for someone who forgot theirs. */
export async function resetPassword(id: string): Promise<string> {
  requireAdmin();
  const password = tempPassword();
  const pass = await hashPassword(password);
  updateUser(id, (u) => ({ ...u, pass, mustChange: true }));
  return password;
}

export function setAdmin(id: string, admin: boolean) {
  const me = requireAdmin();
  if (id === me.id && !admin) throw new Error('You can’t remove your own admin rights.');
  updateUser(id, (u) => ({ ...u, admin }));
}

/** Delete a login and everything it saved on this device. */
export async function removeLogin(id: string): Promise<void> {
  const me = requireAdmin();
  if (id === me.id) throw new Error('You can’t remove your own login.');
  const u = registry().users.find((x) => x.id === id);
  if (!u) return;
  const r = registry();
  save({ ...r, users: r.users.filter((x) => x.id !== id) });
  try {
    localStorage.removeItem(u.settings);
  } catch {
    /* private mode */
  }
  if (typeof indexedDB === 'undefined') return;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(u.db);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

/** Drop a device login once its progress has moved to that person's online login (no admin needed). */
export async function forgetDeviceLogin(id: string): Promise<void> {
  const u = registry().users.find((x) => x.id === id);
  if (!u) return;
  const r = registry();
  save({ users: r.users.filter((x) => x.id !== id), current: r.current === id ? null : r.current });
  try {
    localStorage.removeItem(u.settings);
  } catch {
    /* private mode */
  }
  if (typeof indexedDB === 'undefined') return;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(u.db);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

/** How much each person has done, for the admin's list. */
export async function loginStats(u: Login): Promise<{ attempts: number; lastActive: number | null }> {
  try {
    const store = await openIdbStore(u.db);
    const all = await store.allAttempts();
    store.close();
    return { attempts: all.length, lastActive: all.length ? Math.max(...all.map((a) => a.finishedAt)) : null };
  } catch {
    return { attempts: 0, lastActive: null };
  }
}

// ---------------------------------------------------------------- setup links for someone's own device
export interface JoinInfo {
  username: string;
  name: string;
}
const toB64url = (s: string) => btoa(String.fromCharCode(...enc.encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

/** The code in a setup link: who the login is for. They choose the password on their own device. */
export const joinCode = (u: Pick<Login, 'username' | 'name'>) => toB64url(JSON.stringify({ v: 1, u: u.username, n: u.name }));

export function parseJoin(code: string): JoinInfo | null {
  try {
    const x = JSON.parse(fromB64url(code)) as { v?: number; u?: unknown; n?: unknown };
    const username = normaliseUsername(String(x.u ?? ''));
    const name = String(x.n ?? '').trim();
    return x.v === 1 && USERNAME.test(username) && name ? { username, name: name.slice(0, 60) } : null;
  } catch {
    return null;
  }
}

export const isSetUpHere = (username: string) => registry().users.some((u) => u.username === normaliseUsername(username));

/** Make the login from a setup link on this device, with the password they choose, and sign in. */
export async function acceptJoin(info: JoinInfo, password: string): Promise<Login> {
  checkPasswordRule(password);
  return create({ name: info.name, username: info.username, password, admin: false, mustChange: false, signIn: true });
}

/** For tests: forget the cached registry. */
export function _resetForTests() {
  reg = undefined;
}
