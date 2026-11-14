/** Mr Astbury's booklet: work is saved, ticked off, and shows in the record (the PDF itself is the student's, so it isn't in the tests). */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('booklet: chapters, an answer saved and marked done, and the record for Mr Astbury', async ({ page }) => {
  await page.goto('./#/booklet');
  await expect(page.getByRole('heading', { name: 'Mr Astbury’s booklet' })).toBeVisible();
  await expect(page.getByLabel('Mr Astbury – A Level Exam Qs Series – Pure (PDF)')).toBeVisible();
  await expect(page.getByText('0/250')).toBeVisible();
  await axe(page);
  await page.getByRole('link', { name: /Algebraic Expressions/ }).click();
  await expect(page.getByRole('heading', { name: '1.1 Algebraic Expressions' })).toBeVisible();
  await page.getByRole('link', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: /Question 1/ })).toBeVisible();
  await expect(page.getByText(/Load the booklet on this device to see the question/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Your answer' }).fill('(a) 16 − 4√5 (b) a = 4, b = −1');
  await page.getByRole('button', { name: 'Mark as done' }).click();
  await expect(page.getByRole('button', { name: /Done .* \(undo\)/ })).toBeVisible();
  await axe(page);

  // it's still there after a reload
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Your answer' })).toHaveValue('(a) 16 − 4√5 (b) a = 4, b = −1');
  await page.getByRole('link', { name: 'Question 2' }).click();
  await expect(page.getByRole('heading', { name: /Question 2/ })).toBeVisible();

  await page.goto('./#/booklet/1.1');
  await expect(page.getByText('1 of 8 questions done')).toBeVisible();
  await page.getByRole('link', { name: 'Record of this chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Record for Mr Astbury' })).toBeVisible();
  await expect(page.getByRole('row', { name: /1\.1 Algebraic Expressions 1\/8/ })).toBeVisible();
  await expect(page.getByText('(a) 16 − 4√5 (b) a = 4, b = −1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeEnabled();
});
