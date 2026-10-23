/** Logins, the admin page and free "ask your AI app" marking, against a mocked server. */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerFor, plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const API = 'https://api.test';

interface FakeUser {
  id: number;
  username: string;
  name: string;
  admin: boolean;
  mustChange: boolean;
  disabled: boolean;
  key: string;
}

/** Just enough of server/src/auth.ts: passwords are compared as the app's stretched keys. */
async function accountServer(page: Page, users: Omit<FakeUser, 'id' | 'disabled' | 'key'>[], passwords: Record<string, string>) {
  const { stretch } = await import('../src/lib/stretch');
  const all: FakeUser[] = [];
  for (const [i, u] of users.entries()) all.push({ ...u, id: i + 1, disabled: false, key: await stretch(u.username, passwords[u.username]) });
  const sessions = new Map<string, number>();
  const data = new Map<number, { v: number; data: string; summary?: unknown }>();
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS' };
    const reply = (status: number, body: unknown) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const pub = (u: FakeUser) => ({ id: u.id, username: u.username, name: u.name, admin: u.admin, mustChange: u.mustChange });
    if (path === '/auth/login') {
      const b = req.postDataJSON() as { username: string; key: string };
      const u = all.find((x) => x.username === b.username && x.key === b.key);
      if (!u) return reply(401, { error: 'Wrong username or password' });
      const token = `tok-${u.id}-${sessions.size}-abcdefghijklmnopqrstuvwxyz`;
      sessions.set(token, u.id);
      return reply(200, { token, user: pub(u) });
    }
    const me = all.find((u) => u.id === sessions.get((req.headers()['authorization'] ?? '').replace('Bearer ', '')));
    if (!me) return reply(401, { error: 'Please sign in' });
    if (path === '/auth/logout') return reply(200, { ok: true });
    if (path === '/auth/password') {
      const b = req.postDataJSON() as { current: string; next: string };
      if (b.current !== me.key) return reply(401, { error: 'Your current password is wrong' });
      me.key = b.next;
      me.mustChange = false;
      return reply(200, { ok: true });
    }
    if (path === '/me') {
      if (req.method() === 'PUT') {
        const b = req.postDataJSON() as { base: number; data: string; summary: unknown };
        if ((data.get(me.id)?.v ?? 0) !== b.base) return reply(409, { v: data.get(me.id)?.v ?? 0 });
        data.set(me.id, { v: b.base + 1, data: b.data, summary: b.summary });
        return reply(200, { v: b.base + 1 });
      }
      return reply(200, { user: pub(me), v: data.get(me.id)?.v ?? 0, data: data.get(me.id)?.data });
    }
    if (!me.admin) return reply(403, { error: 'Only an admin can do that' });
    if (path === '/admin/users' && req.method() === 'GET') return reply(200, { users: all.map((u) => ({ ...pub(u), disabled: u.disabled, createdAt: 1, lastSeen: null, summary: data.get(u.id)?.summary ?? null })) });
    if (path === '/admin/users' && req.method() === 'POST') {
      const b = req.postDataJSON() as { username: string; name: string; admin: boolean; key: string };
      if (all.some((u) => u.username === b.username)) return reply(409, { error: `The username "${b.username}" is taken` });
      all.push({ id: all.length + 1, username: b.username, name: b.name, admin: b.admin, mustChange: true, disabled: false, key: b.key });
      return reply(200, { ok: true });
    }
    const target = all.find((u) => u.id === Number(path.split('/')[3]));
    if (!target) return reply(404, { error: 'No such login' });
    if (req.method() === 'DELETE') {
      all.splice(all.indexOf(target), 1);
      return reply(200, { ok: true });
    }
    const b = req.postDataJSON() as { disabled?: boolean; key?: string };
    if (b.disabled !== undefined) target.disabled = b.disabled;
    if (b.key) {
      target.key = b.key;
      target.mustChange = true;
    }
    return reply(200, { ok: true });
  });
  return { all, data };
}

async function signIn(page: Page, username: string, password: string) {
  await page.goto('./#/account');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

const axe = async (page: Page) => {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test('a new person signs in, chooses their own password, and their progress is saved to the account', async ({ page }) => {
  await plainInput(page, { apiUrl: API });
  const server = await accountServer(page, [{ username: 'sam', name: 'Sam', admin: false, mustChange: true }], { sam: 'temp-1234-abcd' });
  await signIn(page, 'sam', 'wrong-password');
  await expect(page.getByText('Wrong username or password')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('temp-1234-abcd');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: /Signed in as Sam/ })).toBeVisible();
  await expect(page.getByText(/signed in with a temporary password/)).toBeVisible();
  await axe(page);
  await page.getByLabel('Temporary password').fill('temp-1234-abcd');
  await page.getByLabel(/^New password \(/).fill('my-own-password');
  await page.getByLabel('New password again').fill('my-own-password');
  await page.getByRole('button', { name: 'Set my password' }).click();
  await expect(page.getByRole('button', { name: 'Save now' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage logins' })).toHaveCount(0);

  await page.goto(`./#/q/${Q}/7`);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 7)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
  await page.goto('./#/account');
  await page.getByRole('button', { name: 'Save now' }).click();
  await expect(page.getByText(/Saved to your account/)).toBeVisible();
  expect(server.data.get(1)?.summary).toMatchObject({ attempts: 1, marks: 4, scored: 4 });

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.locator('.kpi', { hasText: 'questions attempted' }).locator('b')).toHaveText('0'); // removed from the device
  await signIn(page, 'sam', 'my-own-password');
  await expect(page.getByText(/progress from your other devices added/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.locator('.kpi', { hasText: 'questions attempted' }).locator('b')).toHaveText('1'); // back from the account
});

test('an admin makes a login, resets a password and switches a login off', async ({ page }) => {
  await plainInput(page, { apiUrl: API });
  await accountServer(page, [{ username: 'iolo', name: 'Iolo', admin: true, mustChange: false }], { iolo: 'admin-password' });
  await signIn(page, 'iolo', 'admin-password');
  await page.getByRole('link', { name: 'Manage logins' }).click();
  await expect(page.getByRole('heading', { name: 'Manage logins' })).toBeVisible();
  await page.getByLabel('Their name').fill('Ana Bell');
  await expect(page.getByLabel('Username')).toHaveValue('ana.bell');
  await page.getByRole('button', { name: 'Make login' }).click();
  const slip = page.locator('.login-slip');
  await expect(slip).toContainText('Username: ana.bell');
  await expect(slip).toContainText(/Temporary password: [a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}/);
  await expect(slip).toContainText('#/account');
  await axe(page);
  await page.getByRole('button', { name: 'Done' }).click();
  const row = page.getByRole('row', { name: /Ana Bell/ });
  await expect(row).toContainText('hasn’t chosen a password yet');
  await row.getByRole('button', { name: 'Reset password for Ana Bell' }).click();
  await expect(page.locator('.login-slip')).toContainText('Username: ana.bell');
  await page.getByRole('button', { name: 'Done' }).click();
  await row.getByRole('button', { name: 'Switch off Ana Bell' }).click();
  await expect(row).toContainText('switched off');
  // the admin can't switch themselves off
  await expect(page.getByRole('button', { name: 'Switch off Iolo' })).toHaveCount(0);
});

test('someone who is not an admin can’t open the admin page', async ({ page }) => {
  await plainInput(page, { apiUrl: API });
  await accountServer(page, [{ username: 'ben', name: 'Ben', admin: false, mustChange: false }], { ben: 'ben-password' });
  await signIn(page, 'ben', 'ben-password');
  await expect(page.getByRole('heading', { name: /Signed in as Ben/ })).toBeVisible();
  await page.goto('./#/admin');
  await expect(page.getByText('Only an admin can manage logins.')).toBeVisible();
});

test('free AI marking: the question, mark scheme and working go to your own AI app', async ({ page }) => {
  await plainInput(page); // no server needed
  await page.goto(`./#/q/${Q}/8`);
  await page.getByLabel('Answer for the question').fill('12345');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Incorrect')).toBeVisible();
  await page.getByRole('button', { name: 'Ask your AI app' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Ask your AI app to mark this' })).toBeVisible();
  await dialog.getByText('What gets sent').click();
  const text = dialog.getByLabel('Message for your AI app');
  await expect(text).toHaveValue(/Mark scheme:\nM1: /);
  await expect(text).toHaveValue(/My final answer: 12345/);
  await expect(text).toHaveValue(/automatic answer check said: incorrect, 0\/4/);
  await expect(dialog.getByRole('link', { name: 'Open Claude' })).toHaveAttribute('href', 'https://claude.ai/new');
  await axe(page);
  await dialog.getByRole('button', { name: /Copy question and mark scheme/ }).click();
  await expect(dialog.getByRole('status')).toContainText(/copied|Couldn’t copy/);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});
