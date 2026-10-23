/** Logins on a device: set up, make a login for someone, separate progress, setup links. */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerFor, plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const axe = async (page: Page) => {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};
/** Signing in or out reloads the app (everything belongs to the login): wait for that reload. */
const reloads = (page: Page, click: Promise<void>) => Promise.all([page.waitForEvent('load'), click]);
const attempted = (page: Page) => page.locator('.kpi', { hasText: 'questions attempted' }).locator('b');

async function answerOne(page: Page, seed: number) {
  await page.goto(`./#/q/${Q}/${seed}`);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, seed)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
}

test('set up logins, make one for someone, and keep everyone’s progress and settings apart', async ({ page, browser, baseURL }) => {
  await plainInput(page);
  await answerOne(page, 11); // practised before logins existed

  await page.goto('./#/settings');
  await page.getByRole('link', { name: 'Set up logins' }).click();
  await page.getByLabel('Your name').fill('Iolo');
  await expect(page.getByLabel('Username')).toHaveValue('iolo');
  await page.getByLabel(/^Password \(/).fill('iolo-pass');
  await page.getByLabel('Password again').fill('iolo-pass');
  await reloads(page, page.getByRole('button', { name: 'Make my login' }).click());
  await expect(page.getByRole('heading', { name: 'Manage logins' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Signed in as Iolo' })).toBeVisible();

  await page.getByLabel('Their name').fill('Ana Bell');
  await page.getByRole('button', { name: 'Make login' }).click();
  const slips = page.locator('.login-slip');
  await expect(slips.first()).toContainText('Username: ana.bell');
  const temp = (await slips.first().textContent())!.match(/Temporary password: (\S+)/)![1];
  const link = (await slips.nth(1).textContent())!.trim();
  expect(link).toContain('#/join?c=');
  await axe(page);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('row', { name: /Ana Bell/ })).toContainText('temporary password');

  // Iolo keeps what was practised before
  await page.goto('./#/progress');
  await expect(attempted(page)).toHaveText('1');

  // sign out: only the sign-in screen
  await page.getByRole('link', { name: 'Signed in as Iolo' }).click();
  await reloads(page, page.getByRole('button', { name: 'Sign out' }).click());
  await expect(page.getByRole('heading', { name: 'Who’s practising?' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  await axe(page);
  await page.goto('./#/progress');
  await expect(page.getByRole('heading', { name: 'Who’s practising?' })).toBeVisible();

  // Ana signs in with the temporary password and chooses her own
  await page.getByRole('button', { name: 'Ana Bell' }).click();
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Wrong username or password.')).toBeVisible();
  await page.getByLabel('Password').fill(temp);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByLabel(/^New password \(/).fill('ana-pin1');
  await page.getByLabel('New password again').fill('ana-pin1');
  await reloads(page, page.getByRole('button', { name: 'Set my password and sign in' }).click());
  await expect(page.getByRole('link', { name: 'Signed in as Ana Bell' })).toBeVisible();
  await expect(attempted(page)).toHaveText('0'); // her own, empty progress
  await page.goto('./#/settings');
  await expect(page.getByRole('link', { name: 'Manage logins' })).toHaveCount(0);
  await page.getByLabel('Theme').selectOption('dark');
  await page.getByLabel('Answer boxes').selectOption('plain'); // her own settings start at the defaults
  await answerOne(page, 12);

  // back to Iolo: his progress and theme are untouched
  await page.goto('./#/account');
  await reloads(page, page.getByRole('button', { name: 'Sign out' }).click());
  await page.getByRole('button', { name: 'Iolo' }).click();
  await page.getByLabel('Password').fill('iolo-pass');
  await reloads(page, page.getByRole('button', { name: 'Sign in' }).click());
  await expect(page.getByRole('link', { name: 'Signed in as Iolo' })).toBeVisible();
  await page.goto('./#/progress');
  await expect(attempted(page)).toHaveText('1');
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBeNull();
  await page.goto('./#/logins');
  await expect(page.getByRole('row', { name: /Ana Bell/ })).not.toContainText('temporary password');

  // the setup link on Ana's own phone (a separate browser): her login is made there
  const phone = await browser.newContext({ baseURL });
  const p2 = await phone.newPage();
  await p2.goto(link);
  await expect(p2.getByRole('heading', { name: 'Welcome, Ana Bell' })).toBeVisible();
  await p2.getByLabel(/^Password \(/).fill('phone-pin');
  await p2.getByLabel('Password again').fill('phone-pin');
  await reloads(p2, p2.getByRole('button', { name: 'Set up my login' }).click());
  await expect(p2.getByRole('link', { name: 'Signed in as Ana Bell' })).toBeVisible();
  await p2.goto(link);
  await expect(p2.getByText('Your login is already set up on this device.')).toBeVisible();
  await phone.close();
});
