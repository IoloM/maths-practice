/**
 * Mr Astbury's booklet: answers by part, marked against the worked solution, counted in progress
 * and topics like any question, and shown in the record (the PDF itself is the student's, so it
 * isn't in the tests).
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('booklet: answers by part, marked, counted in progress, and in the record for Mr Astbury', async ({ page }) => {
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

  // answers for each part, then marks for each part
  await page.getByRole('textbox', { name: 'Answer to part (a)' }).fill('16 − 4√5');
  await page.getByRole('textbox', { name: 'Answer to part (b)' }).fill('4 − √5');
  await page.getByRole('button', { name: 'Mark my answers' }).click();
  await expect(page.getByRole('heading', { name: 'Mark it against the worked solution' })).toBeVisible();
  await page.getByRole('group', { name: 'Marks for part (a)' }).getByRole('button', { name: '3' }).click();
  await page.getByRole('group', { name: 'Marks for part (b)' }).getByRole('button', { name: '2' }).click();
  await expect(page.getByText('Total: 5/6')).toBeVisible();
  // an extra mark after a second look
  await page.getByRole('group', { name: 'Marks for part (b)' }).getByRole('button', { name: '3' }).click();
  await expect(page.getByText('Total: 6/6')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Full marks!' })).toBeVisible();
  await expect(page.getByText(/Counted in your progress for Algebraic expressions/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Done .* \(undo\)/ })).toBeVisible();
  await axe(page);

  // still there after a reload
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Answer to part (a)' })).toHaveValue('16 − 4√5');

  // counted once (changing the mark updated it), in the chapter and on the progress page
  await page.goto('./#/progress');
  await expect(page.locator('.kpis .kpi b').first()).toHaveText('1');
  await expect(page.getByRole('link', { name: /Mr Astbury 1\.1 Algebraic Expressions: question 1/ })).toBeVisible();
  await page.goto('./#/topics');
  // self-marked marks count at 80% towards mastery, as for the app's other self-marked questions
  await expect(page.getByRole('link', { name: /Algebraic expressions/ }).getByRole('img', { name: /Green 80%/ })).toBeVisible();

  await page.goto('./#/booklet/1.1');
  await expect(page.getByText('1 of 8 questions done')).toBeVisible();
  await expect(page.getByText('6/6 marks against the worked solutions', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Record of this chapter' }).click();
  await expect(page.getByRole('heading', { name: 'Record for Mr Astbury' })).toBeVisible();
  await expect(page.getByRole('row', { name: /1\.1 Algebraic Expressions 1\/8/ })).toBeVisible();
  await expect(page.locator('.record-parts')).toContainText('16 − 4√5');
  await expect(page.locator('.record-status')).toContainText('6/6 marks');
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeEnabled();
});
