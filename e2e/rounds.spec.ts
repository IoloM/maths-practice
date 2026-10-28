/** Speed rounds and A* stretch problems. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';
import { speedRound } from '../src/lib/speed';
import { canonicalResponse } from '../src/engine/marking/mark';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('a speed round: 10 questions marked as you go, then your score and personal best', async ({ page }) => {
  const qs = speedRound('pure', 7);
  await page.goto('./#/speed?area=pure&seed=7');
  await expect(page.getByRole('heading', { name: 'Speed rounds' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pure speed round' }).getByText('Not tried yet')).toBeVisible();
  await axe(page);
  await page.getByRole('button', { name: 'Start pure round' }).click();
  await expect(page.getByRole('timer')).toHaveText(/[45]:\d\d/);
  for (let i = 0; i < qs.length; i++) {
    await expect(page.getByRole('region', { name: `Question ${i + 1}` })).toBeVisible();
    if (i === 3) {
      // get one wrong: it shows the right answer
      await page.getByLabel(/Answer for the question/).fill('123456789');
      await page.keyboard.press('Enter');
      await expect(page.getByText('✗ Not quite')).toBeVisible();
      await axe(page);
    } else if (i === 9) {
      await page.getByRole('button', { name: 'Skip' }).click();
      break;
    } else {
      await page.getByLabel(/Answer for the question/).fill(String(canonicalResponse(qs[i].answer)));
      await page.keyboard.press('Enter');
      await expect(page.getByText('✓ Right')).toBeVisible();
    }
    // the next button takes the focus, so Enter moves on
    await expect(page.getByRole('button', { name: /Next question|See how you did/ })).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading', { name: /^8\/10 in \d:\d\d$/ })).toBeVisible();
  await expect(page.getByText(/Your first Pure round/)).toBeVisible();
  await expect(page.locator('.speed-mark.no')).toHaveCount(2);
  await axe(page);

  await page.goto('./#/');
  await expect(page.getByRole('link', { name: /Speed round\s*Best 8\/10/ })).toBeVisible();
  await page.goto('./#/speed');
  await expect(page.getByRole('region', { name: 'Pure speed round' }).getByText(/Best 8\/10 in \d:\d\d · 1 round$/)).toBeVisible();
});

test('a speed round ends when the 5 minutes are up', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/speed');
  await page.getByRole('button', { name: 'Start mechanics round' }).click();
  await expect(page.getByRole('region', { name: 'Question 1' })).toBeVisible();
  await page.clock.fastForward(5 * 60_000 + 1000);
  await expect(page.getByRole('heading', { name: '0/10 in 5:00' })).toBeVisible();
  await expect(page.getByText(/Time ran out/)).toBeVisible();
});

test('A* stretch problems: the list, then a set of them', async ({ page }) => {
  await page.goto('./#/exams');
  await page.getByRole('link', { name: /A\* stretch problems/ }).click();
  await expect(page.getByRole('heading', { name: 'A* stretch problems', level: 1 })).toBeVisible();
  const list = page.getByRole('region', { name: 'Stretch problems: several topics in one' });
  await expect(list.getByRole('listitem')).toHaveCount(6);
  await expect(page.getByText('0 of 6 tried')).toBeVisible();
  await axe(page);
  await list.getByRole('link', { name: /tangent to a cubic meets it again/ }).click();
  await expect(page.getByRole('heading', { name: /tangent to a cubic/ })).toBeVisible();
  await page.goto('./#/stretch');
  await page.getByRole('link', { name: 'Start stretch problems' }).click();
  await expect(page.getByRole('heading', { name: 'A* stretch problems' })).toBeVisible();
});
