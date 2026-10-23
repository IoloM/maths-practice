/** Automated accessibility checks (axe-core: WCAG 2.1 A/AA and best practice, moderate impact or worse) on every main page, light and dark. */
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const PAGES: [string, string][] = [
  ['home', './'],
  ['topics', './#/topics'],
  ['chapter', './#/chapter/P1.13'],
  ['question', `./#/q/${Q}/1`],
  ['question with diagram', './#/q/p2.5.segment-area-and-perimeter/3'],
  ['fixed question', './#/q/fx.lds.days-in-period/0'],
  ['choice options that are all maths', './#/q/fx.proof.ce-square-inequality/0'],
  ['exams', './#/exams'],
  ['review', './#/review'],
  ['progress', './#/progress'],
  ['reference', './#/reference'],
  ['flashcards', './#/flashcards'],
  ['settings', './#/settings'],
];

async function audit(page: Page, label: string) {
  await page.waitForTimeout(400);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  const bad = res.violations.filter((v) => v.impact !== 'minor');
  const report = bad.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n  ')}`).join('\n');
  expect(bad, `${label}\n${report}`).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => plainInput(page));
    for (const [name, url] of PAGES) {
      test(`${name} has no accessibility violations`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await audit(page, `${scheme} ${name}`);
      });
    }
    test('exam view has no accessibility violations', async ({ page }) => {
      await page.goto(`./#/set/import?c=${encodeURIComponent(`timed~10~${Q}:2,p2.5.segment-area-and-perimeter:3~A11y set`)}`);
      await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
      await expect(page.getByText(/answered/)).toBeVisible();
      await audit(page, `${scheme} exam view`);
    });
  });
}

test('progress page with a predicted grade has no accessibility violations', async ({ page }) => {
  await plainInput(page);
  await page.goto(`./#/set/import?c=${encodeURIComponent(`mock~5~${Q}:5~A11y mock`)}`);
  await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Finish & mark/ }).first().click();
  await page.goto('./#/progress');
  await expect(page.locator('.grade-badge')).toBeVisible();
  await page.locator('details summary').first().click();
  await audit(page, 'progress with predicted grade');
});

test('every formulae and tables tab has no accessibility violations', async ({ page }) => {
  await page.goto('./#/reference');
  for (const name of ['Pure formulae', 'Statistics formulae', 'Mechanics formulae', 'Binomial tables', 'Normal table', 'PMCC table', 'Calculator']) {
    await page.getByRole('tab', { name }).click();
    await audit(page, `reference: ${name}`);
  }
});
