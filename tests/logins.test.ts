import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as L from '../src/lib/logins';

beforeEach(() => {
  const ls = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => ls.set(k, v), removeItem: (k: string) => ls.delete(k) });
  L._resetForTests();
});

describe('logins on this device', () => {
  it('works as before until logins are set up', () => {
    expect(L.loginsEnabled()).toBe(false);
    expect(L.needsSignIn()).toBe(false);
    expect(L.dbName()).toBe('maths-practice');
    expect(L.settingsKey()).toBe('mp.settings.v1');
  });

  it('the first login is an admin and keeps the progress already on the device', async () => {
    const me = await L.setUpFirstLogin({ name: 'Iolo', username: ' Iolo ', password: 'secret-1' });
    expect(me).toMatchObject({ username: 'iolo', admin: true, db: 'maths-practice', settings: 'mp.settings.v1' });
    expect(L.currentLogin()?.id).toBe(me.id);
    expect(me.pass).toMatch(/^p1\$100000\$/);
    expect(me.pass).not.toContain('secret-1');
    await expect(L.setUpFirstLogin({ name: 'X', username: 'x', password: 'abcd' })).rejects.toThrow(/already set up/);
  });

  it('an admin makes logins with their own storage and a temporary password that must be changed', async () => {
    await L.setUpFirstLogin({ name: 'Iolo', username: 'iolo', password: 'secret-1' });
    const { login, password } = await L.addLogin({ name: 'Ana Bell', username: 'ana', admin: false });
    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(login).toMatchObject({ mustChange: true, admin: false });
    expect(login.db).not.toBe('maths-practice');
    expect(login.settings).not.toBe('mp.settings.v1');
    await expect(L.addLogin({ name: 'Another Ana', username: 'ana', admin: false })).rejects.toThrow(/already a login/);
    await expect(L.addLogin({ name: 'Bad', username: 'Bad Name!', admin: false })).rejects.toThrow(/Usernames/);

    L.signOut();
    expect(L.needsSignIn()).toBe(true);
    expect(L.dbName()).not.toBe('maths-practice'); // nobody's progress while signed out
    await expect(L.signIn('ana', 'wrong')).rejects.toThrow(/Wrong username or password/);
    expect((await L.findForSignIn('ANA', password)).mustChange).toBe(true);
    await L.signIn('ana', password, 'anas-own');
    expect(L.currentLogin()).toMatchObject({ username: 'ana', mustChange: false });
    expect(L.dbName()).toBe(login.db);
    expect(L.settingsKey()).toBe(login.settings);
    // not an admin
    await expect(L.addLogin({ name: 'Cat', username: 'cat', admin: false })).rejects.toThrow(/Only an admin/);
    await L.changePassword('anas-own', 'newer-one');
    L.signOut();
    await L.signIn('ana', 'newer-one');
    expect(L.currentLogin()?.username).toBe('ana');
  });

  it('admins reset passwords, share admin, and remove logins but never themselves', async () => {
    const me = await L.setUpFirstLogin({ name: 'Iolo', username: 'iolo', password: 'secret-1' });
    const { login } = await L.addLogin({ name: 'Ben', username: 'ben', admin: false });
    const temp = await L.resetPassword(login.id);
    expect((await L.findForSignIn('ben', temp)).mustChange).toBe(true);
    L.setAdmin(login.id, true);
    expect(L.allLogins().find((u) => u.id === login.id)?.admin).toBe(true);
    expect(() => L.setAdmin(me.id, false)).toThrow(/own admin/);
    await expect(L.removeLogin(me.id)).rejects.toThrow(/own login/);
    await L.removeLogin(login.id);
    expect(L.allLogins().map((u) => u.username)).toEqual(['iolo']);
  });

  it('a setup link makes the login on someone’s own device, where they choose the password', async () => {
    const code = L.joinCode({ username: 'zoë.w', name: 'Zoë Wright' });
    expect(L.parseJoin(code)).toBeNull(); // usernames are plain a–z: this one was never valid
    const ok = L.joinCode({ username: 'zoe.w', name: 'Zoë Wright' });
    const info = L.parseJoin(ok)!;
    expect(info).toEqual({ username: 'zoe.w', name: 'Zoë Wright' });
    expect(L.parseJoin('nonsense')).toBeNull();
    // on her phone, with no logins yet: she becomes its first login (and admin there)
    const zoe = await L.acceptJoin(info, 'zoes-pin');
    expect(zoe).toMatchObject({ username: 'zoe.w', admin: true, db: 'maths-practice' });
    expect(L.isSetUpHere('ZOE.W')).toBe(true);
    await expect(L.acceptJoin(info, 'again')).rejects.toThrow(/already a login/);
    await expect(L.acceptJoin({ username: 'kai', name: 'Kai' }, 'abc')).rejects.toThrow(/at least 4/);
  });
});

describe('usernames for several logins at once', () => {
  it('first names, made unique against existing logins and each other', async () => {
    const { usernamesFor } = await import('../src/pages/CloudLogins');
    expect(usernamesFor(['Ana Jones', 'Ben', 'Ben Smith', 'Ben Smith', 'Zoë Brontë'], ['ana', 'iolo'])).toEqual(['ana.jones', 'ben', 'ben.smith', 'ben2', 'zoe']);
  });
});
