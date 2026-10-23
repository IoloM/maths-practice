/**
 * Logins made by the app's admin (server/src/auth.ts). Signed in, a person's progress, history and
 * settings are saved to their account and follow them to any device.
 *
 * The password never leaves the device: it is stretched here (PBKDF2, 100,000 rounds, salted with
 * the username) and only the result is sent.
 */
import { getStore } from '../storage';
import { notifyProgress } from '../progress/record';
import { request } from './api';
import { stretch, tempPassword } from './stretch';

export { stretch, tempPassword };

export interface AccountUser {
  id: number;
  username: string;
  name: string;
  admin: boolean;
  mustChange: boolean;
}

const KEY = 'mp.account.v1';
let current: { token: string; user: AccountUser } | null | undefined;
const listeners = new Set<() => void>();

export function readAccount(): { token: string; user: AccountUser } | null {
  if (current === undefined) {
    try {
      current = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    } catch {
      current = null;
    }
  }
  return current ?? null;
}
function saveAccount(a: { token: string; user: AccountUser } | null) {
  current = a;
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: signed in until the tab closes */
  }
  listeners.forEach((f) => f());
}
export function onAccountChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
export const authHeader = (): Record<string, string> => {
  const a = readAccount();
  return a ? { authorization: `Bearer ${a.token}` } : {};
};

export const USERNAME = /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/;
export const MIN_PASSWORD = 8;

export async function signIn(username: string, password: string): Promise<AccountUser> {
  const u = username.trim().toLowerCase();
  const { body } = await request<{ token: string; user: AccountUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, key: await stretch(u, password) }) });
  saveAccount(body);
  return body.user;
}

/** The account's details as the server last reported them (e.g. after an admin made it an admin). */
export function updateUser(user: AccountUser) {
  const a = readAccount();
  if (a && JSON.stringify(a.user) !== JSON.stringify(user)) saveAccount({ ...a, user });
}

/** Forget the sign-in on this device (the server session is ended if it can be reached). */
export function forgetAccount() {
  saveAccount(null);
}

/** Sign out and remove this person's progress from the device (it stays in their account). */
export async function signOut(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST', headers: authHeader(), body: '{}', timeoutMs: 8000 });
  } catch {
    /* offline or already expired: the session lapses by itself */
  }
  saveAccount(null);
  await (await getStore()).clearAll();
  notifyProgress();
}

export async function changePassword(current: string, next: string): Promise<void> {
  const a = readAccount();
  if (!a) throw new Error('Sign in first');
  const u = a.user.username;
  await request('/auth/password', { method: 'POST', headers: authHeader(), body: JSON.stringify({ current: await stretch(u, current), next: await stretch(u, next) }) });
  saveAccount({ ...a, user: { ...a.user, mustChange: false } });
}

// ---------------------------------------------------------------- admin
export interface ManagedUser extends AccountUser {
  disabled: boolean;
  createdAt: number;
  lastSeen: number | null;
  summary: { attempts?: number; marks?: number; scored?: number; lastActive?: number } | null;
}

export async function listUsers(): Promise<ManagedUser[]> {
  return (await request<{ users: ManagedUser[] }>('/admin/users', { headers: authHeader() })).body.users;
}

/** Make a login; returns the temporary password to give to the person. */
export async function createUser(p: { username: string; name: string; admin: boolean }): Promise<string> {
  const password = tempPassword();
  const username = p.username.trim().toLowerCase();
  await request('/admin/users', { method: 'POST', headers: authHeader(), body: JSON.stringify({ username, name: p.name.trim(), admin: p.admin, key: await stretch(username, password) }) });
  return password;
}

/** A new temporary password (signs the person out everywhere). */
export async function resetPassword(u: ManagedUser): Promise<string> {
  const password = tempPassword();
  await request(`/admin/users/${u.id}`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify({ key: await stretch(u.username, password) }) });
  return password;
}

export async function updateManagedUser(u: ManagedUser, p: { disabled?: boolean; admin?: boolean; name?: string }): Promise<void> {
  await request(`/admin/users/${u.id}`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify(p) });
}

export async function deleteManagedUser(u: ManagedUser): Promise<void> {
  await request(`/admin/users/${u.id}`, { method: 'DELETE', headers: authHeader() });
}
