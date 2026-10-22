/** Automated accessibility checks (axe-core, WCAG 2.1 A/AA) on every main page, light and dark. */
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
  ['exams', './#/exams'],
  ['review', './#/review'],
  ['progress', './#/progress'],
  ['reference', './#/reference'],
  ['settings', './#/settings'],
];

async function audit(page: Page, label: string) {
  await page.waitForTimeout(400);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.katex-mathml').analyze();
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = bad.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n  ')}`).join('\n');
  expect(bad, `${label}\n${report}`).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => plainInput(page));
    for (const [name, url] of PAGES) {
      test(`${name} has no serious accessibility violations`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await audit(page, `${scheme} ${name}`);
      });
    }
    test('exam view has no serious accessibility violations', async ({ page }) => {
      await page.goto(`./#/set/import?c=${encodeURIComponent(`timed~10~${Q}:2,p2.5.segment-area-and-perimeter:3~A11y set`)}`);
      await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
      await expect(page.getByText(/answered/)).toBeVisible();
      await audit(page, `${scheme} exam view`);
    });
  });
}
