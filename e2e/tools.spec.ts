/** Search, sitting a real past paper as an exam, and grades over time. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('search finds things across the app and goes there', async ({ page }) => {
  await page.goto('./#/');
  await page.getByRole('button', { name: 'Search' }).click();
  const box = page.getByRole('combobox', { name: /Search topics/ });
  await box.fill('mistake notebook');
  await expect(page.getByRole('option').first()).toContainText('Mistake notebook');
  await axe(page);
  await box.press('Enter');
  await expect(page.getByRole('heading', { name: 'Mistake notebook' })).toBeVisible();
  // the keyboard shortcut, and a formula
  await page.keyboard.press('/');
  await page.getByRole('combobox', { name: /Search topics/ }).fill('trapezium rule');
  await page.getByRole('option').filter({ hasText: 'in the booklet' }).first().click();
  await expect(page.getByRole('tab', { name: 'Formula booklet' })).toHaveAttribute('aria-selected', 'true');
});

test('sit a past paper: the clock, time per question, then marks with the times', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/sit/2019-06-1');
  await expect(page.getByRole('heading', { name: /Sit June 2019 Paper 1/ })).toBeVisible();
  await axe(page);
  await page.getByRole('button', { name: /Start — the clock begins now/ }).click();
  await expect(page.getByText(/Working on/)).toContainText('question 1');
  await page.clock.runFor(4 * 60_000);
  await page.getByRole('button', { name: /On to question 2/ }).click();
  await page.clock.runFor(2 * 60_000);
  await expect(page.getByRole('region', { name: 'Exam clock' })).toContainText(/On pace|behind/);
  await axe(page);
  // a reload carries on where it was
  await page.reload();
  await expect(page.getByText(/Working on/)).toContainText('question 2');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Finish' }).click();
  const paper = page.locator('#paper-2019-06-1');
  await expect(paper.getByText(/took 4 min/)).toBeVisible();
  await expect(paper.getByLabel(/Time taken/)).toHaveValue('6');
});

test('grades over time appear once a paper is marked', async ({ page }) => {
  await page.goto('./#/past-papers?p=2024-06-1&mark=1');
  const paper = page.locator('#paper-2024-06-1');
  const boxes = paper.locator('.mark-entry').getByRole('spinbutton');
  await expect(boxes.first()).toBeVisible();
  const n = await boxes.count();
  for (let i = 0; i < n; i++) await boxes.nth(i).fill(String(Math.max(0, Number(await boxes.nth(i).getAttribute('max')) - 1)));
  await page.goto('./#/progress');
  const chart = page.getByRole('region', { name: 'Grades over time' });
  await expect(chart.getByRole('group', { name: /1 paper\. Latest: June 2024 Paper 1/ })).toBeVisible();
  await chart.getByText('Show as a table').click();
  await expect(chart.getByRole('rowheader', { name: 'June 2024 Paper 1' })).toBeVisible();
  await axe(page);
});

test('the large data set explorer reads a spreadsheet and shows summaries, a scatter and samples', async ({ page }, info) => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [station, base] of [
    ['Heathrow', 16],
    ['Leuchars', 12],
  ] as const) {
    const rows: unknown[][] = [[station], [], ['Date', 'Daily Mean Temperature (0900-0900) (°C)', 'Daily Total Sunshine (0000-2400) (hrs)', 'Daily Total Rainfall (0900-0900) (mm)']];
    for (let d = 0; d < 40; d++) rows.push([new Date(2015, 4, 1 + d), base + (d % 7) * 0.5, (d % 9) * 1.1, d % 5 === 0 ? 'tr' : d % 11 === 0 ? 'n/a' : (d % 4) * 0.8]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows, { cellDates: true }), `${station} May-Oct 2015`);
  }
  const file = info.outputPath('lds.xlsx');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

  await page.goto('./#/data');
  await expect(page.getByRole('heading', { name: 'Large data set explorer' })).toBeVisible();
  await axe(page);
  await page.getByLabel('Large data set file').setInputFiles(file);
  await expect(page.getByText(/2 station-years/)).toBeVisible();
  const sum = page.getByRole('region', { name: /Mean Temperature .*at Heathrow/ });
  await expect(sum.getByRole('row', { name: /Days with data/ })).toContainText('40');
  await page.getByLabel('Compare with').selectOption('Leuchars');
  await expect(sum.getByRole('img', { name: /Box plots/ })).toHaveAttribute('aria-label', /Leuchars/);
  await page.getByLabel('Variable').selectOption({ label: 'Total Rainfall (mm)' });
  await expect(page.getByRole('region', { name: /Total Rainfall .*at Heathrow/ }).getByRole('row', { name: /Days with data/ })).toContainText(/3\d \(\d+ n\/a, 8 tr\)/);
  await expect(page.getByRole('region', { name: 'Is there a relationship?' })).toContainText(/PMCC r = /);
  await page.getByRole('region', { name: 'Take a sample' }).getByRole('button', { name: /Another sample/ }).click();
  await expect(page.getByText(/Sample mean/)).toBeVisible();
  await axe(page);
  // it's remembered on this device
  await page.reload();
  await expect(page.getByText(/2 station-years/)).toBeVisible();
});

test('the graph plotter draws functions, makes sliders, and lists key points', async ({ page }) => {
  await page.goto('./#/graphs');
  await expect(page.getByRole('heading', { name: 'Graph plotter' })).toBeVisible();
  await page.getByRole('button', { name: 'Quadratic and a line' }).click();
  await expect(page.getByLabel('m value')).toBeVisible();
  const key = page.getByRole('region', { name: 'Key points' });
  await expect(key.getByRole('row', { name: /Minimum/ })).toContainText('-4');
  await expect(key.getByRole('row', { name: /Root/ }).first()).toContainText('-2');
  await page.getByLabel('m exact value').fill('0');
  await page.getByLabel('c exact value').fill('5');
  await expect(key.getByRole('row', { name: /Crossing/ }).first()).toContainText('5');
  await page.getByLabel('Function 1', { exact: true }).fill('y = (');
  await expect(page.locator('#fn-err-0')).toBeVisible();
  await axe(page);
});

test('the moving page explains itself when opened on its own, and the old-address notice stays away elsewhere', async ({ page }) => {
  await page.goto('./#/move');
  await expect(page.getByRole('heading', { name: 'Moving your progress' })).toBeVisible();
  await expect(page.getByText(/brings your progress across from the old address/)).toBeVisible();
  await axe(page);
  await page.goto('./#/');
  await expect(page.getByText('Maths Practice has moved')).toHaveCount(0);
});
