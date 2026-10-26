/** Online logins (the app built with Supabase settings) against a pretend Supabase. */
import { expect, test, type Browser, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerFor, plainInput } from './helpers';
import { fakeState, serveSupabase, type FakeState } from './fake-supabase';

const Q = 'p1.13.definite-polynomial';
// Once the offline service worker controls a page, WebKit sends its requests past Playwright's
// routing (to the real, unreachable supa.test), so these tests run without it.
test.use({ serviceWorkers: 'block' });
const axe = async (page: Page) => {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};
const attempted = (page: Page) => page.locator('.kpi', { hasText: 'questions attempted' }).locator('b');
/** Signing in or out reloads the app (everything belongs to the login): wait for that reload. */
const reloads = (page: Page, click: Promise<void>) => Promise.all([page.waitForEvent('load'), click]);

/** Another phone, tablet or computer: its own storage, the same pretend Supabase. */
async function device(browser: Browser, baseURL: string | undefined, s: FakeState) {
  const ctx = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  await serveSupabase(ctx, s);
  const page = await ctx.newPage();
  await plainInput(page);
  return page;
}

async function answerOne(page: Page, seed: number) {
  await page.goto(`./#/q/${Q}/${seed}`);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, seed)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
}

/** Username first; then the password (or, the first time, a new one). Leaves the last click to the caller. */
async function signIn(page: Page, username: string, password: string) {
  await page.goto('./#/account');
  await page.getByLabel('Username').fill(username);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill(password);
}

/** First sign-in on a new (or reset) login: choose a password, and the app restarts signed in. */
async function firstSignIn(page: Page, username: string, password: string) {
  await page.goto('./#/account');
  await page.getByLabel('Username').fill(username);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Choose your password' })).toBeVisible();
  await page.getByLabel(/^New password \(/).fill(password);
  await page.getByLabel('New password again').fill(password);
  await reloads(page, page.getByRole('button', { name: 'Set my password and sign in' }).click());
}

test('an admin makes a login with just a username; the person chooses their password and their progress follows them', async ({ page, browser, baseURL }) => {
  const s = fakeState([{ username: 'iolo', name: 'Iolo', password: 'admin-pass-1', admin: true }]);
  await serveSupabase(page.context(), s);
  await plainInput(page);

  // practised without signing in, then signs in: that progress comes along
  await answerOne(page, 21);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
  await page.goto('./#/account');
  await page.getByLabel('Username').fill('nobody');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/no login with that username/)).toBeVisible();
  // carry on in the same page (going to the same address again would reload it, losing a guest's work)
  await page.getByLabel('Username').fill('iolo');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('wrong-pass');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Wrong username or password.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('admin-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await expect(page.getByRole('link', { name: 'Signed in as Iolo' })).toBeVisible();
  await page.goto('./#/progress');
  await expect(attempted(page)).toHaveText('1');
  await expect.poll(() => s.progress.size).toBe(1); // saved online

  // make a login for Ana: no password involved
  await page.goto('./#/logins');
  await page.getByLabel('Their name').fill('Ana Bell');
  await page.getByRole('button', { name: 'Make login' }).click();
  const slip = page.locator('.login-slip');
  await expect(slip).toContainText('Username: ana.bell');
  await expect(slip).toContainText('choose your own password');
  await expect(slip).not.toContainText(/password:/i);
  await axe(page);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('row', { name: /Ana Bell/ })).toContainText('hasn’t set a password yet');

  // Ana on her phone: chooses her own password the first time
  const phone = await device(browser, baseURL, s);
  await firstSignIn(phone, 'ana.bell', 'anas-password');
  await expect(phone.getByRole('link', { name: 'Signed in as Ana Bell' })).toBeVisible();
  await answerOne(phone, 22);
  await phone.goto('./#/account');
  await phone.getByRole('button', { name: 'Save now' }).click();
  await expect(phone.getByRole('status').filter({ hasText: /Saved/ })).toBeVisible();

  // ...and on her laptop: her password, and the same progress
  const laptop = await device(browser, baseURL, s);
  await signIn(laptop, 'ana.bell', 'anas-password');
  await reloads(laptop, laptop.getByRole('button', { name: 'Sign in' }).click());
  await laptop.goto('./#/progress');
  await expect(attempted(laptop)).toHaveText('1');

  // the group sees her week (totals only); she now has a password
  await page.goto('./#/group');
  await expect(page.getByRole('row', { name: /Ana Bell/ })).toContainText('1');
  await axe(page);
  await page.goto('./#/logins');
  await expect(page.getByRole('row', { name: /Ana Bell/ })).not.toContainText('hasn’t set a password yet');
  await phone.context().close();
  await laptop.context().close();
});

test('a reset password: the old one stops working and they choose a new one', async ({ page, browser, baseURL }) => {
  const s = fakeState([
    { username: 'iolo', name: 'Iolo', password: 'admin-pass-1', admin: true },
    { username: 'ben', name: 'Ben', password: 'forgotten-1' },
  ]);
  await serveSupabase(page.context(), s);
  await plainInput(page);
  await signIn(page, 'iolo', 'admin-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await page.goto('./#/logins');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Reset password for Ben' }).click();
  await expect(page.locator('.login-slip')).toContainText('has been reset');
  expect(s.profiles.find((p) => p.username === 'ben')!.must_change).toBe(true);

  const ben = await device(browser, baseURL, s);
  await firstSignIn(ben, 'ben', 'bens-new-pass');
  await expect(ben.getByRole('link', { name: 'Signed in as Ben' })).toBeVisible();
  expect(s.users.find((u) => u.email.startsWith('ben@'))!.password).toBe('bens-new-pass');
  await ben.context().close();
});

test('an admin sets work for the group; it is done and handed in', async ({ page, browser, baseURL }) => {
  const s = fakeState([
    { username: 'iolo', name: 'Iolo', password: 'admin-pass-1', admin: true },
    { username: 'ana', name: 'Ana', password: 'ana-pass-1' },
  ]);
  await serveSupabase(page.context(), s);
  await plainInput(page);
  await signIn(page, 'iolo', 'admin-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await expect(page.getByRole('link', { name: 'Signed in as Iolo' })).toBeVisible();
  await page.goto(`./#/set/import?c=${encodeURIComponent(`timed~10~${Q}:23~Integration check`)}`);
  await page.getByRole('button', { name: 'Set this for the group' }).click();
  await page.getByLabel('Due (optional)').fill('2030-01-10');
  await page.getByRole('button', { name: 'Set it' }).click();
  await expect(page.getByText(/on everyone’s Set work page/)).toBeVisible();
  expect(s.assignments).toHaveLength(1);

  const ana = await device(browser, baseURL, s);
  await signIn(ana, 'ana', 'ana-pass-1');
  await reloads(ana, ana.getByRole('button', { name: 'Sign in' }).click());
  await ana.goto('./#/group');
  await expect(ana.getByText('Integration check')).toBeVisible();
  await expect(ana.getByText(/due Thu,? (10 Jan|Jan 10)/)).toBeVisible();
  await ana.getByRole('button', { name: 'Start' }).click();
  await ana.getByRole('button', { name: /Start — the timer begins now/ }).click();
  await ana.getByLabel(/Answer for question 1/).fill(String(answerFor(Q, 23)));
  ana.once('dialog', (d) => d.accept());
  await ana.getByRole('button', { name: /Finish & mark/ }).first().click();
  await expect.poll(() => s.results.length).toBe(1);
  expect(s.results[0]).toMatchObject({ got: 4, of: 4 });
  await ana.goto('./#/group');
  await expect(ana.getByText('All done — nice work.')).toBeVisible();
  // members see only their own work: no leaderboard, no one else's results
  await expect(ana.getByRole('heading', { level: 1, name: 'Set work' })).toBeVisible();
  await expect(ana.getByRole('heading', { name: 'This week' })).toHaveCount(0);
  await expect(ana.getByRole('button', { name: /of \d+ done/ })).toHaveCount(0);

  await page.goto('./#/group');
  await expect(page.getByRole('button', { name: '1 of 2 done' })).toBeVisible();
  await page.getByRole('button', { name: '1 of 2 done' }).click();
  await expect(page.getByText('4/4 (100%)')).toBeVisible();
  await ana.context().close();
});

test('a switched-off login can’t sign in', async ({ page }) => {
  const s = fakeState([{ username: 'ben', name: 'Ben', password: 'ben-pass-1' }]);
  s.profiles[0].disabled = true;
  s.users[0].banned = true;
  await serveSupabase(page.context(), s);
  await plainInput(page);
  await page.goto('./#/account');
  await page.getByLabel('Username').fill('ben');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/switched off/)).toBeVisible();
});

test('without an account nothing is saved, and signing in keeps what was done in that visit', async ({ page }) => {
  const s = fakeState([{ username: 'cara', name: 'Cara', password: 'cara-pass-1' }]);
  await serveSupabase(page.context(), s);
  await plainInput(page);
  await page.goto('./');
  await expect(page.getByRole('note')).toContainText('nothing you do is saved');
  await answerOne(page, 31);
  await page.goto('./#/progress');
  await expect(attempted(page)).toHaveText('1');
  await page.reload(); // a guest's work is gone after a reload
  await expect(attempted(page)).toHaveText('0');
  await answerOne(page, 32);
  await signIn(page, 'cara', 'cara-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await expect(page.getByRole('note')).toHaveCount(0);
  await page.goto('./#/progress');
  await expect(attempted(page)).toHaveText('1'); // this visit's work came along
});

test('a device with logins on it can still be used without an account', async ({ page }) => {
  const s = fakeState([{ username: 'cara', name: 'Cara', password: 'cara-pass-1' }]);
  await serveSupabase(page.context(), s);
  await plainInput(page);
  // a login made on this device before logins went online
  await page.addInitScript(() => localStorage.setItem('mp.logins.v1', JSON.stringify({ users: [{ id: 'x', username: 'dev', name: 'Dev', admin: true, pass: 'p1$1$a$b', mustChange: false, createdAt: 1, db: 'maths-practice', settings: 'mp.settings.v1' }], current: null })));
  await page.goto('./');
  await page.getByRole('button', { name: /Use without an account/ }).click();
  await expect(page.getByRole('note')).toContainText('nothing you do is saved');
  await expect(page.getByRole('heading', { name: 'Edexcel A Level Maths practice' })).toBeVisible();
});

test('an admin sees what everyone is working on', async ({ page, browser, baseURL }) => {
  const s = fakeState([
    { username: 'iolo', name: 'Iolo', password: 'admin-pass-1', admin: true },
    { username: 'ana', name: 'Ana', password: 'ana-pass-1' },
  ]);
  await serveSupabase(page.context(), s);
  await plainInput(page);

  const ana = await device(browser, baseURL, s);
  await signIn(ana, 'ana', 'ana-pass-1');
  await reloads(ana, ana.getByRole('button', { name: 'Sign in' }).click());
  await answerOne(ana, 33);
  await ana.goto('./#/account');
  await ana.getByRole('button', { name: 'Save now' }).click();
  await expect.poll(() => s.activity.size).toBe(1);
  // members can't see each other's work
  await ana.goto('./#/logins');
  await expect(ana.getByText('Only an admin can manage logins.')).toBeVisible();

  await signIn(page, 'iolo', 'admin-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await page.goto('./#/logins');
  const feed = page.getByRole('region', { name: 'What everyone’s doing' });
  await expect(feed).toContainText('Ana');
  await expect(feed).toContainText('4/4');
  await page.getByRole('button', { name: /View Ana.s work/ }).click();
  await expect(page.getByRole('heading', { name: 'Recent questions' })).toBeVisible();
  await expect(page.getByText(/questions · 100% of marks/)).toBeVisible();
  await axe(page);
  // a printable report, for one person or everyone
  await page.getByRole('link', { name: 'Progress report for Ana' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Progress report: Ana' })).toBeVisible();
  const report = page.getByRole('region', { name: 'Report for Ana' });
  await expect(report.getByRole('row', { name: /Questions answered/ })).toContainText('1');
  await expect(report.getByRole('rowheader', { name: 'Integration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  await axe(page);
  await page.goto('./#/report/all');
  await expect(page.getByRole('region', { name: 'Report for Ana' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Report for Iolo' })).toBeVisible();
  // members can't
  await ana.goto('./#/report/all');
  await expect(ana.getByText('Only an admin can see progress reports.')).toBeVisible();
  await ana.context().close();
});

test('an admin sets work by topic and a weekly target, sees the hardest topics, and members get a due reminder', async ({ page, browser, baseURL }) => {
  const s = fakeState([
    { username: 'iolo', name: 'Iolo', password: 'admin-pass-1', admin: true },
    { username: 'ana', name: 'Ana', password: 'ana-pass-1' },
  ]);
  await serveSupabase(page.context(), s);
  await plainInput(page);
  // Ana has struggled with integration
  s.activity.set(s.profiles[1].id, { chapters: [{ chapter: 'P1.13', title: 'Integration', questions: 3, pct: 25, last: 1 }], help: ['P1.13'] });

  await signIn(page, 'iolo', 'admin-pass-1');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await page.goto('./#/group');
  const weak = page.getByRole('region', { name: 'Topics the group finds hardest' });
  await expect(weak.getByRole('rowheader', { name: 'Integration' })).toBeVisible();
  await expect(weak).toContainText('Ana');
  await expect(weak.getByRole('row', { name: /Integration/ }).getByRole('cell').nth(3)).toHaveText('Ana'); // asked for help
  await weak.getByRole('button', { name: 'Set work on Integration' }).click();
  const form = page.getByRole('region', { name: 'Set work by topic' });
  // Pure Year 1's Integration (Year 2 has one too)
  await expect(form.getByLabel('Integration', { exact: true }).first()).toBeChecked();
  await expect(form.getByLabel('Integration', { exact: true }).last()).not.toBeChecked();
  const tomorrow = new Date(Date.now() + 86_400_000);
  await form.getByLabel('Due').fill(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`);
  await expect(form.getByText(/questions · \d+ marks/)).toBeVisible();
  await axe(page);
  await form.getByRole('button', { name: 'Set it for everyone' }).click();
  await expect.poll(() => s.assignments.length).toBe(1);
  expect(s.assignments[0]).toMatchObject({ title: 'Integration' });
  // 20 marks at 1.2 minutes a mark (a set can fall a mark or two short)
  expect(Number(s.assignments[0].duration_min)).toBeGreaterThanOrEqual(20);
  expect(Number(s.assignments[0].duration_min)).toBeLessThanOrEqual(24);
  await page.getByLabel(/Weekly target/).fill('12');
  await page.getByRole('button', { name: 'Set target' }).click();
  await expect(page.getByText(/Target: 12 questions each/)).toBeVisible();
  expect(s.target).toBe(12);

  const ana = await device(browser, baseURL, s);
  await signIn(ana, 'ana', 'ana-pass-1');
  await reloads(ana, ana.getByRole('button', { name: 'Sign in' }).click());
  await expect(ana.getByRole('status').filter({ hasText: /Integration.*due tomorrow/ })).toBeVisible();
  await ana.getByRole('link', { name: 'Do it' }).click();
  await expect(ana.getByRole('region', { name: 'Your weekly target' })).toContainText('This week: 0 of 12 questions');
  await expect(ana.getByText(/Target: 12 questions each/)).toHaveCount(0);
  await expect(ana.getByText('Iolo')).toHaveCount(0);
  await expect(ana.getByRole('region', { name: 'Set work by topic' })).toHaveCount(0);
  await ana.goto('./#/');
  await expect(ana.getByRole('region', { name: 'Your plan for today' }).getByText('Set work: Integration')).toBeVisible();
  await ana.context().close();
});
