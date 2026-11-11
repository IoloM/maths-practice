/** AS mode, AS mock papers, and the new long and "find the error" questions. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('AS mode: Year 1 topics, AS mocks, AS past papers and an AS grade', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('radio', { name: /AS Mathematics \(8MA0\) only/ }).check();
  await expect(page.getByLabel('AS Paper 2: Statistics and Mechanics')).toBeVisible();
  await expect(page.getByLabel('Paper 3: Statistics and Mechanics')).toHaveCount(0);
  await axe(page);

  await page.goto('./#/topics');
  await expect(page.getByText('Showing AS topics (Year 1) only.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pure Year 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pure Year 2' })).toHaveCount(0);

  await page.goto('./#/exams');
  const as2 = page.getByRole('listitem').filter({ hasText: 'AS Paper 2: Statistics and Mechanics' });
  await expect(as2).toContainText('60 marks · 75 min');
  await expect(page.getByRole('button', { name: 'Start Paper 1: Pure Mathematics 1' })).toBeHidden();
  await axe(page);
  await page.getByRole('button', { name: 'Start AS Paper 1: Pure Mathematics' }).click();
  await expect(page.getByRole('heading', { name: /AS Paper 1: Pure Mathematics/ })).toBeVisible();

  await page.goto('./#/past-papers');
  await expect(page.getByLabel('Level')).toHaveValue('as');
  await expect(page.locator('#paper-2025-06-1')).toHaveCount(0);

  await page.goto('./#/progress');
  await expect(page.getByRole('heading', { name: 'Predicted AS grade' })).toBeVisible();
  await expect(page.getByText(/enter your marks for a real AS past paper/)).toBeVisible();

  // back to A level: everything comes back
  await page.goto('./#/settings');
  await page.getByRole('radio', { name: /A level Mathematics \(9MA0\)/ }).check();
  await page.goto('./#/topics');
  await expect(page.getByRole('heading', { name: 'Pure Year 2' })).toBeVisible();
  await expect(page.getByText('Showing AS topics (Year 1) only.')).toHaveCount(0);
});

test('a long exam-style question and a find-the-error question open and render', async ({ page }) => {
  await page.goto('./#/practice?t=p1.7.long-factor-theorem-and-inequality');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/passes through the point/)).toBeVisible();
  await expect(page.getByText(/giving your answer in set notation/)).toBeVisible();
  await axe(page);
  await page.goto('./#/practice?t=fx.pure.error-log-of-sum');
  await expect(page.getByText('Which line contains the error, and why?')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Line 1:' }).first()).toBeVisible();
});
