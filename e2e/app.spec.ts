import { expect, test } from '@playwright/test';
import { answerFor, plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';

test.beforeEach(async ({ page }) => {
  await plainInput(page);
});

test('home page lists topics and loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Edexcel A Level Maths practice/ })).toBeVisible();
  await page.getByRole('link', { name: /Integration \(Pure Y1/ }).click();
  await expect(page.getByRole('heading', { name: 'Integration' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('answer a question correctly and see the worked solution', async ({ page }) => {
  await page.goto(`./#/q/${Q}/1`);
  const box = page.getByLabel('Answer for the question');
  await box.fill(String(answerFor(Q, 1)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toContainText('4/4');
  await page.getByRole('button', { name: /Show worked solution/ }).click();
  await expect(page.getByText('Worked solution', { exact: true })).toBeVisible();
});

test('wrong answer shows feedback and the mark scheme for self-marking', async ({ page }) => {
  await page.goto(`./#/q/${Q}/2`);
  await page.getByLabel('Answer for the question').fill('12345');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Incorrect')).toBeVisible();
  await expect(page.getByText(/tick the marks your working shows/)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Award M1' }).check();
  await expect(page.getByText(/Self-awarded: 1/)).toBeVisible();
});

test('draw in the working canvas', async ({ page }) => {
  await page.goto(`./#/q/${Q}/3`);
  const canvas = page.getByRole('img', { name: /Handwritten working/ });
  await canvas.scrollIntoViewIfNeeded();
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + 40, b.y + 40);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(b.x + 40 + i * 12, b.y + 40 + i * 6);
  await page.mouse.up();
  const inked = await canvas.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  expect(inked).toBeGreaterThan(50);
  await page.getByRole('button', { name: 'Undo' }).click();
});

test('works offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright drives service workers in Chromium only');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // wait for precache to finish
  await page.waitForFunction(async () => (await caches.keys()).length > 0 && (await (await caches.open((await caches.keys())[0])).keys()).length > 20);
  await context.setOffline(true);
  await page.goto(`./#/q/${Q}/4`);
  await page.reload();
  const box = page.getByLabel('Answer for the question');
  await box.fill(String(answerFor(Q, 4)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
  await context.setOffline(false);
});

test('back up and restore progress', async ({ page }) => {
  await page.goto(`./#/q/${Q}/5`);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 5)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByText('questions attempted')).toBeVisible();
  await expect(page.locator('.kpi b').first()).toHaveText('1');
  await page.goto('./#/settings');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Back up progress/ }).click()]);
  const file = await download.path();
  // wipe progress with the app's own (confirmed) delete
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Delete all progress/ }).click();
  await expect(page.getByText(/All progress on this device has been deleted/)).toBeVisible();
  // reload the progress page itself (a hash change straight after reload() can race the reload in WebKit)
  await page.goto('./#/progress');
  await page.reload();
  await expect(page.locator('.kpi b').first()).toHaveText('0');
  await page.goto('./#/settings');
  await page.getByTestId('restore-input').setInputFiles(file!);
  await expect(page.getByText(/Restored 1 attempts/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.locator('.kpi b').first()).toHaveText('1');
});

test('a fixed multiple-choice question loads lazily and marks the chosen option', async ({ page }) => {
  await page.goto('./#/q/fx.lds.days-in-period/0');
  await expect(page.getByText('fixed question')).toBeVisible();
  await page.getByRole('radio', { name: '184', exact: true }).check();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
});

test('multiple-choice options written in maths have spoken names', async ({ page }) => {
  await page.goto('./#/q/fx.proof.ce-square-inequality/0');
  await page.getByRole('radio', { name: 'x = − 3' }).check();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
});

test('moving between questions with different numbers of parts does not crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/q/sm2.4.uniform-rod-on-two-supports/2');
  await expect(page.getByRole('heading', { name: /uniform rod/i })).toBeVisible();
  await page.goto('./#/q/sm2.4.ladder-limiting-equilibrium/3');
  await expect(page.getByRole('heading', { name: /Ladder/ })).toBeVisible();
  await expect(page.getByText('Find the coefficient of friction')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a shared timed set runs under exam conditions and is marked at the end', async ({ page }) => {
  const code = encodeURIComponent(`timed~5~${Q}:5~E2E set`);
  await page.goto(`./#/set/import?c=${code}`);
  await expect(page.getByRole('heading', { name: 'E2E set' })).toBeVisible();
  await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
  await expect(page.getByText(/answered/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check' })).toHaveCount(0);
  await page.getByLabel('Answer for question 1').fill(String(answerFor(Q, 5)));
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Finish & mark/ }).first().click();
  await expect(page.getByText(/marks \(100%\)/)).toBeVisible();
});

test('reference page shows generated statistical tables', async ({ page }) => {
  await page.goto('./#/reference');
  await page.getByRole('tab', { name: 'Normal table' }).click();
  await expect(page.getByRole('cell', { name: '1.9600' })).toBeVisible();
  await page.getByRole('tab', { name: 'PMCC table' }).click();
  const row12 = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: '12', exact: true }) });
  await expect(row12.getByRole('cell').nth(1)).toHaveText('0.4973'); // n = 12, 5% one-tailed
});

test('the page frame is in the HTML, so it paints before the scripts run', async ({ request }) => {
  const html = await (await request.get('./')).text();
  expect(html).toContain('class="app-header"');
  expect(html).toMatch(/<nav class="tabbar" aria-label="Main">.*Settings<\/a><\/nav>/);
});

test('a page whose code fails to download shows a way out instead of a blank screen', async ({ page }) => {
  await page.route('**/assets/Progress-*.js', (r) => r.abort());
  await page.goto('./#/progress');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  await page.getByRole('link', { name: 'Home' }).last().click();
  await expect(page.getByRole('heading', { name: /Edexcel A Level Maths practice/ })).toBeVisible();
});

test('flashcards: study a card, rate it, and it counts as started', async ({ page }) => {
  await page.goto('./#/flashcards');
  await page.getByRole('button', { name: /^Study \d+ cards?/ }).first().click();
  await page.getByRole('button', { name: 'Show answer' }).click();
  await page.getByRole('button', { name: 'Good' }).click();
  await expect(page.getByText(/1 done/)).toBeVisible();
  await page.keyboard.press(' ');
  await page.keyboard.press('1'); // Again: the card comes back later in the session
  await expect(page.getByText(/2 done/)).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText(/2 of \d+ started/)).toBeVisible();
});

test('formulae page has calculator tips', async ({ page }) => {
  await page.goto('./#/reference');
  await page.getByRole('tab', { name: 'Calculator' }).click();
  await expect(page.getByRole('heading', { name: 'Normal distribution' })).toBeVisible();
  await expect(page.getByText(/not the variance/)).toBeVisible();
});

test('a finished mock gives a grade and a predicted grade on the progress page', async ({ page }) => {
  await page.goto(`./#/set/import?c=${encodeURIComponent(`mock~5~${Q}:5~E2E mock`)}`);
  await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
  await page.getByLabel('Answer for question 1').fill(String(answerFor(Q, 5)));
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Finish & mark/ }).first().click();
  await expect(page.getByText(/grade for 100% on June 2026 boundaries/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByRole('heading', { name: 'Predicted grade' })).toBeVisible();
  await expect(page.getByText('Predicted grade A*.')).toBeAttached();
  await expect(page.locator('.grade-badge')).toHaveText('A*');
});
