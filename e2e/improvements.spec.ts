/** Past-paper marks, the exam countdown and printable papers. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const axe = async (page: import('@playwright/test').Page) => {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test('enter marks for a real past paper: score, grade, weak topics and the predicted grade', async ({ page }) => {
  await plainInput(page);
  await page.goto('./#/past-papers?p=2024-06-1');
  const paper = page.locator('#paper-2024-06-1');
  await paper.getByRole('button', { name: 'Enter my marks' }).click();
  const boxes = paper.locator('.mark-entry').getByRole('spinbutton');
  const n = await boxes.count();
  expect(n).toBeGreaterThan(5);
  // full marks everywhere except nothing on question 1
  for (let i = 0; i < n; i++) {
    const box = boxes.nth(i);
    const max = Number(await box.getAttribute('max'));
    await box.fill(String(i === 0 ? 0 : max));
  }
  const q1max = Number(await boxes.first().getAttribute('max'));
  await expect(paper.getByRole('status')).toContainText(`${100 - q1max} / 100`);
  await expect(paper.getByRole('status')).toContainText('June 2024 overall boundaries');
  await expect(paper.getByRole('link', { name: 'Practise this' })).toHaveCount(1);
  // why the marks went on question 1, a note, and when it was done
  await paper.getByRole('group', { name: /Why marks were lost on question/ }).getByRole('button', { name: 'Careless slip' }).click();
  await expect(paper.getByRole('button', { name: 'Careless slip' })).toHaveAttribute('aria-pressed', 'true');
  await paper.getByLabel(/^Note for question/).fill('dropped a minus sign');
  await paper.getByLabel('Time taken').fill('115');
  await paper.getByLabel(/^Done on/).fill('2026-10-20');
  await expect(paper.getByText(/Where the marks went: Careless slip/)).toBeVisible();
  await axe(page);
  await paper.getByRole('button', { name: 'Done entering marks' }).click();
  await expect(paper.getByText(new RegExp(`You: ${100 - q1max}/100`))).toBeVisible();

  // listed at the top of the page with its date
  await page.reload();
  await expect(page.getByRole('region', { name: 'Your papers' })).toContainText(/June 2024 · Paper 1.*done (20 Oct|Oct 20),? 2026/);
  await expect(page.getByRole('region', { name: 'Your papers' })).toContainText('Careless slip');

  await page.goto('./#/progress');
  await expect(page.getByRole('heading', { name: 'Real past papers' })).toBeVisible();
  await expect(page.getByText(/Kinds of mistake: Careless slip/)).toBeVisible();
  await expect(page.getByText(/June 2024 · Paper 1/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where real papers lose you marks' })).toBeVisible();
  await expect(page.getByText(/of the marks on your last real past paper/)).toBeVisible();
  await expect(page.locator('.grade-badge')).toBeVisible();

  // a typed mark above the maximum is capped, and marks can be cleared
  await page.goto('./#/past-papers?p=2024-06-1');
  await paper.getByRole('button', { name: 'Edit my marks' }).click();
  await boxes.first().fill('99');
  await expect(boxes.first()).toHaveValue(String(q1max));
  page.once('dialog', (d) => d.accept());
  await paper.getByRole('button', { name: 'Clear my marks' }).click();
  await expect(paper.getByRole('status')).toContainText('No marks entered yet');
});

test('exam countdown from the dates in settings', async ({ page }) => {
  await plainInput(page);
  await page.goto('./');
  await expect(page.getByText(/Add your exam dates/)).toBeVisible();
  await page.goto('./#/settings');
  const inAYear = new Date(Date.now() + 365 * 86_400_000);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Paper 1: Pure Mathematics 1').fill(iso(inAYear));
  await page.getByLabel('Paper 2: Pure Mathematics 2').fill(iso(new Date(inAYear.getTime() + 7 * 86_400_000)));
  await expect(page.getByText(/365 days to go/)).toBeVisible();
  await page.goto('./');
  const countdown = page.getByRole('region', { name: 'Exam countdown' });
  await expect(countdown.locator('.countdown-days')).toHaveText('365');
  await expect(countdown).toContainText('days to Paper 1: Pure Mathematics 1');
  await expect(countdown).toContainText('Paper 2: 372 days');
  await axe(page);
});

test('print a set as a paper with its mark scheme', async ({ page, browserName }) => {
  await plainInput(page);
  await page.goto(`./#/set/import?c=${encodeURIComponent('timed~10~p1.13.definite-polynomial:2,p2.5.segment-area-and-perimeter:3,fx.proof.ce-square-inequality:0~Print test')}`);
  await page.getByRole('link', { name: 'Print it instead' }).click();
  await expect(page.getByRole('heading', { name: 'Print: Print test' })).toBeVisible();
  const paper = page.getByRole('article', { name: 'Printable paper' });
  await expect(paper.locator('.print-question')).toHaveCount(3);
  await expect(paper.locator('.answer-lines').first()).toBeVisible();
  await expect(paper.getByRole('region', { name: 'Mark scheme' })).toContainText('M1');
  // the multiple-choice question shows lettered options, and the scheme gives the letter
  await expect(paper.locator('.print-options li').first()).toContainText('A');
  await expect(paper.getByRole('region', { name: 'Mark scheme' })).toContainText(/Answer: [A-H]/);
  await axe(page);
  // PRINT_PDF=<file> saves the default printout, to look at by eye
  if (browserName === 'chromium' && process.env.PRINT_PDF) await page.pdf({ path: process.env.PRINT_PDF, format: 'A4' });
  await page.getByLabel('Mark scheme (from a new page)').uncheck();
  await expect(paper.getByRole('region', { name: 'Mark scheme' })).toHaveCount(0);
  await page.getByLabel('Answer space').selectOption('none');
  await expect(paper.locator('.answer-lines')).toHaveCount(0);
  // printing hides the app around the paper
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-toolbar')).toBeHidden();
  await expect(page.locator('.app-header')).toBeHidden();
  await expect(paper).toBeVisible();
});
