/** Today's plan, the mistake notebook, step-by-step mode and adaptive practice. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answerFor, plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('a wrong answer goes in the mistake notebook, with a note, until it is put right', async ({ page }) => {
  await page.goto(`./#/q/${Q}/2`);
  await page.getByLabel('Answer for the question').fill('12345');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Incorrect')).toBeVisible();

  await page.goto('./#/');
  const plan = page.getByRole('region', { name: 'Your plan for today' });
  await expect(plan.getByRole('link', { name: /Put right 1 mistake/ })).toBeVisible();
  await plan.getByRole('link', { name: /Put right 1 mistake/ }).click();

  await expect(page.getByRole('heading', { name: 'Mistake notebook' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'To put right (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Careless slip' }).click();
  await expect(page.getByRole('button', { name: 'Careless slip' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByPlaceholder(/Note to self/).fill('Subtract F(a) from F(b), not the other way');
  await page.getByPlaceholder(/Note to self/).blur();
  await axe(page);
  await page.reload();
  await expect(page.getByPlaceholder(/Note to self/)).toHaveValue('Subtract F(a) from F(b), not the other way');

  // put it right
  await page.getByRole('link', { name: 'Try it again' }).click();
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 2)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correct' })).toBeVisible();
  await page.goto('./#/mistakes');
  await expect(page.getByRole('tab', { name: 'To put right (0)' })).toBeVisible();
  await page.getByRole('tab', { name: 'Sorted (1)' }).click();
  await expect(page.getByText(/Put right on/)).toBeVisible();
});

test('step by step shows the worked solution a step at a time, leaving the last step to you', async ({ page }) => {
  await page.goto(`./#/q/${Q}/3`);
  await page.getByRole('button', { name: 'Step by step' }).click();
  const steps = page.getByRole('region', { name: 'Step by step' });
  await expect(steps.locator('.steps li')).toHaveCount(1);
  const more = steps.getByRole('button', { name: /Show step 2 of/ });
  await more.click();
  await expect(steps.locator('.steps li')).toHaveCount(2);
  while (await steps.getByRole('button', { name: /Show step/ }).count()) await steps.getByRole('button', { name: /Show step/ }).click();
  await expect(steps.getByText(/The last step is yours/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Hint/ })).toHaveCount(0);
  await axe(page);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 3)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(steps.getByText(/The last step is yours/)).toHaveCount(0);
});

test('practice says what level it is working at, and the setting turns it off', async ({ page }) => {
  await page.goto('./#/practice?c=P1.13');
  await expect(page.getByText(/Working at level 2 of 5/)).toBeVisible();
  await page.goto('./#/settings');
  await page.getByLabel(/Adapt practice to how you’re doing/).uncheck();
  await page.goto('./#/practice?c=P1.12');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Working at level/)).toHaveCount(0);
});

test('the plan on the home page has no accessibility violations', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.getByRole('region', { name: 'Your plan for today' })).toBeVisible();
  await axe(page);
});

test('beat my score: a challenge link, and who won', async ({ page }) => {
  await page.goto(`./#/set/import?c=${encodeURIComponent(`timed~10~${Q}:5~Integration duel`)}&beat=2/4&by=Iolo`);
  await expect(page.getByText(/Iolo.*scored 2\/4 on these questions/)).toBeVisible();
  await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
  await page.getByLabel('Answer for question 1').fill(String(answerFor(Q, 5)));
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Finish & mark/ }).first().click();
  await expect(page.getByText(/You beat Iolo!/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Challenge a friend to beat 4\/4/ })).toBeVisible();
  await axe(page);
});

test('badges: earned ones pop up and show on the progress page', async ({ page }) => {
  await page.goto(`./#/q/${Q}/6`);
  await expect(page.getByLabel('Answer for the question')).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByLabel('Answer for the question').fill(String(answerFor(Q, 6)));
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'New badge: First steps' })).toBeVisible();
  await page.goto('./#/progress');
  const badges = page.getByRole('region', { name: /Badges/ });
  await expect(badges).toContainText(/1 of \d+/);
  await expect(badges.locator('li.got')).toContainText('First steps');
});

test('accessibility settings: bigger text, an easier-to-read font, and read aloud', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __said: string[] };
    w.__said = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => void w.__said.push(u.text);
      window.speechSynthesis.cancel = () => {};
    }
  });
  await page.goto('./#/settings');
  const a11y = page.getByRole('region', { name: 'Accessibility' });
  await a11y.getByLabel('Extra large').check();
  await expect.poll(() => page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize) * 10) / 10)).toBe(20.8);
  await a11y.getByLabel(/Easier-to-read font/).check();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Atkinson Hyperlegible');
  await expect.poll(() => page.evaluate(async () => (await document.fonts.load('16px "Atkinson Hyperlegible"')).length)).toBeGreaterThan(0);
  await axe(page);

  await page.goto(`./#/q/${Q}/4`);
  const read = page.getByRole('button', { name: 'Read aloud' });
  if (await read.count()) {
    await read.click();
    const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said.join(' '));
    expect(said).toMatch(/^Question 1\. .*Find the exact value of the integral|^Question 1\./);
    expect(said).toMatch(/marks?\./);
  }
  // still big after a reload
  await page.reload();
  await expect.poll(() => page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize) * 10) / 10)).toBe(20.8);
});
