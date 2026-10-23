/** Sync and AI features against a mocked server (the real one is tested in server/test). */
import { expect, test, type Locator, type Page, type Request } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerFor, plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const API = 'https://api.test';

interface Seen {
  read: Request[];
  mark: Request[];
  puts: Request[];
}

/** A fake server; returns the requests it saw. */
async function fakeServer(page: Page, opts: { read?: string } = {}): Promise<Seen> {
  const seen: Seen = { read: [], mark: [], puts: [] };
  const rows = new Map<string, { v: number; data: string }>();
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-access-code', 'access-control-allow-methods': 'GET, PUT, POST, OPTIONS' };
    const reply = (status: number, body: unknown) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (path === '/health') return reply(200, { ok: true, ai: true });
    if (path.startsWith('/ai/') && req.headers()['x-access-code'] !== 'right-code') return reply(401, { error: 'Wrong or missing access code' });
    if (path === '/ai/check') return reply(200, { ok: true });
    if (path === '/ai/read') {
      seen.read.push(req);
      return reply(200, { answer: opts.read ?? '1', unclear: false, note: '' });
    }
    if (path === '/ai/mark') {
      seen.mark.push(req);
      return reply(200, { lines: [{ index: 0, awarded: true, comment: 'You integrated each term correctly.' }], summary: 'Good method; the limits went wrong.', nextStep: 'Substitute the upper limit first.', legible: true });
    }
    const id = path.split('/')[2];
    if (req.method() === 'PUT') {
      seen.puts.push(req);
      const { base, data } = req.postDataJSON() as { base: number; data: string };
      if ((rows.get(id)?.v ?? 0) !== base) return reply(409, { v: rows.get(id)?.v ?? 0 });
      rows.set(id, { v: base + 1, data });
      return reply(200, { v: base + 1 });
    }
    const row = rows.get(id);
    return row ? reply(200, row) : reply(404, { v: 0 });
  });
  return seen;
}

async function scribble(page: Page, canvas: Locator) {
  await canvas.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -100);
  });
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + 30, b.y + 30);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(b.x + 30 + i * 10, b.y + 30 + (i % 3) * 8);
  await page.mouse.up();
}

test('write an answer by hand, then have the AI mark the working and use its ticks', async ({ page }) => {
  await plainInput(page, { apiUrl: API, aiCode: 'right-code' });
  const seen = await fakeServer(page, { read: '12345' });
  await page.goto(`./#/q/${Q}/4`);
  await page.getByRole('button', { name: 'Write it by hand: the question' }).click();
  const pad = page.getByRole('dialog');
  await expect(pad.getByRole('heading', { name: 'Write your final answer' })).toBeVisible();
  await scribble(page, pad.getByRole('img', { name: 'Answer writing pad' }));
  await pad.getByRole('button', { name: 'Read my writing' }).click();
  await expect(pad.getByText('The AI read', { exact: true })).toBeVisible();
  await pad.getByRole('button', { name: 'Use this answer' }).click();
  await expect(pad).toBeHidden();
  await expect(page.getByLabel('Answer for the question')).toHaveValue('12345');
  const sent = seen.read[0].postDataJSON() as { image: string; question: string };
  expect(sent.image).toMatch(/^iVBOR/); // a PNG
  expect(sent.question).toContain('\\int');

  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Incorrect')).toBeVisible();
  await scribble(page, page.getByRole('img', { name: /Handwritten working/ }));
  await page.getByRole('button', { name: 'AI: mark my working' }).click();
  await expect(page.getByText('You integrated each term correctly.')).toBeVisible();
  await expect(page.getByText(/Substitute the upper limit first/)).toBeVisible();
  const marked = seen.mark[0].postDataJSON() as { scheme: { code: string }[]; image?: string; answer: string; autoResult: string };
  expect(marked.scheme[0].code).toBe('M1');
  expect(marked.image).toMatch(/^iVBOR/);
  expect(marked.answer).toBe('12345');
  expect(marked.autoResult).toContain('incorrect');
  await page.getByRole('button', { name: 'Use these ticks for self-marking' }).click();
  await expect(page.getByText(/Self-awarded: 1/)).toBeVisible();
});

test('a correct answer read from handwriting marks as correct', async ({ page }) => {
  await plainInput(page, { apiUrl: API, aiCode: 'right-code' });
  await fakeServer(page, { read: String(answerFor(Q, 5)) });
  await page.goto(`./#/q/${Q}/5`);
  await page.getByRole('button', { name: 'Write it by hand: the question' }).click();
  await scribble(page, page.getByRole('img', { name: 'Answer writing pad' }));
  await page.getByRole('button', { name: 'Read my writing' }).click();
  await page.getByRole('button', { name: 'Use this answer' }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toContainText('4/4');
});

test('no AI buttons without an access code', async ({ page }) => {
  await plainInput(page, { apiUrl: API });
  await page.goto(`./#/q/${Q}/4`);
  await expect(page.getByLabel('Answer for the question')).toBeVisible();
  await expect(page.getByRole('button', { name: /Write it by hand/ })).toHaveCount(0);
});

test('settings: test the access code, and start syncing', async ({ page }) => {
  await plainInput(page, { apiUrl: API });
  const seen = await fakeServer(page);
  await page.goto('./#/settings');
  await page.getByText(/Built-in AI \(optional/).click();
  const code = page.getByLabel(/AI access code/);
  await code.fill('wrong-code');
  await page.getByRole('button', { name: 'Save and test' }).click();
  await expect(page.getByText('That access code is wrong.')).toBeVisible();
  await code.fill('right-code');
  await page.getByRole('button', { name: 'Save and test' }).click();
  await expect(page.getByText(/Access code works/)).toBeVisible();

  await page.getByText(/No login\? Sync your own devices/).click();
  await page.getByRole('button', { name: /Start syncing/ }).click();
  await expect(page.getByLabel('Sync code')).toHaveText(/^[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){4}$/);
  await expect(page.getByText(/last synced/)).toBeVisible();
  expect(seen.puts.length).toBeGreaterThanOrEqual(1);
  expect(seen.puts[0].postData()).not.toContain('maths-practice'); // only ciphertext leaves the device

  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(a11y.violations.filter((v) => v.impact !== 'minor').map((v) => v.id)).toEqual([]);
});

test('a second device joins with the code and gets the progress', async ({ page, browser, baseURL }) => {
  // two "devices" (separate browser storage) sharing one fake server
  const rows = new Map<string, { v: number; data: string }>();
  await plainInput(page, { apiUrl: API });
  await routeShared(page, rows);
  await page.goto(`./#/q/${Q}/6`);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 6)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
  await page.goto('./#/settings');
  await page.getByText(/No login\? Sync your own devices/).click();
  await page.getByRole('button', { name: /Start syncing/ }).click();
  await expect(page.getByText(/last synced/)).toBeVisible();
  const syncCode = (await page.getByLabel('Sync code').textContent())!.trim();

  const other = await browser.newContext({ baseURL });
  const two = await other.newPage();
  await plainInput(two, { apiUrl: API });
  await routeShared(two, rows);
  await two.goto('./#/settings');
  await two.getByText(/No login\? Sync your own devices/).click();
  await two.getByLabel(/Have a code from another device/).fill(syncCode.toLowerCase().replace(/-/g, ' '));
  await two.getByRole('button', { name: 'Use this code' }).click();
  await expect(two.getByText(/progress from your other devices added/)).toBeVisible();
  await two.goto('./#/progress');
  await expect(two.locator('.kpi', { hasText: 'questions attempted' }).locator('b')).toHaveText('1');
  await other.close();
});

async function routeShared(page: Page, rows: Map<string, { v: number; data: string }>) {
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-access-code', 'access-control-allow-methods': 'GET, PUT, POST, OPTIONS' };
    const reply = (status: number, body: unknown) => route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const id = new URL(req.url()).pathname.split('/')[2];
    if (req.method() === 'PUT') {
      const { base, data } = req.postDataJSON() as { base: number; data: string };
      if ((rows.get(id)?.v ?? 0) !== base) return reply(409, { v: rows.get(id)?.v ?? 0 });
      rows.set(id, { v: base + 1, data });
      return reply(200, { v: base + 1 });
    }
    const row = rows.get(id);
    return row ? reply(200, row) : reply(404, { v: 0 });
  });
}
