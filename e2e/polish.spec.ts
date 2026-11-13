/** The practice timer, keyboard shortcuts, full marks, the session summary, your week, topic rings and the printable report. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('practice: a timer, full marks, keyboard shortcuts and a session summary', async ({ page }) => {
  await page.goto('./#/practice?t=fx.pure.error-tan-second-solution');
  await expect(page.locator('.q-timer')).toContainText(/\d:\d\d · aim ~2 min/);
  await page.getByRole('radio', { name: /repeats every/ }).check();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Full marks, no hints!' })).toBeVisible();
  await expect(page.locator('.q-timer')).toContainText('took');
  await expect(page.getByText(/This session: 1 question · 2\/2 marks \(100%\)/)).toBeVisible();
  // the shortcuts button is for keyboards (hidden on touch screens)
  if (await page.evaluate(() => matchMedia('(hover: none)').matches)) await expect(page.getByRole('button', { name: 'Keyboard shortcuts' })).toBeHidden();
  else {
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
    await expect(page.getByRole('region', { name: 'Keyboard shortcuts' })).toContainText('next question');
  }
  await axe(page);
  await page.getByRole('button', { name: 'Finish and see summary' }).click();
  await expect(page.getByRole('heading', { name: 'Session summary' })).toBeVisible();
  await expect(page.getByText('Full marks on every question.')).toBeVisible();
  await page.getByRole('button', { name: 'Keep practising' }).click();
  await expect(page.getByRole('heading', { name: 'Session summary' })).toHaveCount(0);

  // N goes to the next question once this one is marked; H gives a hint
  await page.goto('./#/practice?t=p1.1.simplify-index-laws');
  await expect(page.locator('.q-num')).toHaveText('1.');
  await page.locator('body').press('h');
  await expect(page.getByRole('button', { name: /Next hint \(2\/3\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Give up & show solutions' }).click();
  await page.locator('body').press('n');
  await expect(page.locator('.q-num')).toHaveText('2.');

  // your week on the home page, and a ring on the topic tile
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Your week' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Exams and challenges' })).toBeVisible();
  await axe(page);
  await page.goto('./#/topics');
  await expect(page.getByRole('link', { name: /Trigonometric identities and equations/ }).getByRole('img', { name: /Green 100%/ })).toBeVisible();
  await expect(page.getByText('1 question type', { exact: true })).toHaveCount(0);

  // the progress report prints
  await page.goto('./#/progress');
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
});
