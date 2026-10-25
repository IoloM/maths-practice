/** Marking topics to learn or for help, and learning them: notes, a worked example, videos, your own notes and links. */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { plainInput } from './helpers';

const Q = 'p1.13.definite-polynomial';
const axe = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(300);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).exclude('.katex-mathml').analyze();
  expect(res.violations.filter((v) => v.impact !== 'minor').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
};

test.beforeEach(async ({ page }) => plainInput(page));

test('mark a topic, then learn it: notes, worked example, videos, your notes and links', async ({ page }) => {
  // nothing is fetched from YouTube unless a video is played
  const youtube: string[] = [];
  page.on('request', (r) => /youtube|ytimg/.test(r.url()) && youtube.push(r.url()));

  await page.goto('./#/chapter/P2.11');
  await page.getByRole('group', { name: 'Mark Integration' }).getByRole('button', { name: 'I need help with this' }).click();
  await expect(page.getByRole('button', { name: 'I need help with this' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Learn it' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Integration' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Notes', exact: true })).toContainText('Key ideas');
  const ex = page.locator('.learn-example');
  await ex.getByRole('button', { name: 'Show the first step' }).click();
  await expect(ex.locator('.steps li')).toHaveCount(1);
  await ex.getByRole('button', { name: /Next step/ }).click();
  await expect(ex.locator('.steps li')).toHaveCount(2);
  const videos = page.getByRole('region', { name: 'Videos' });
  await expect(videos.getByRole('button', { name: /^Play video:/ })).toHaveCount(2);
  await expect(page.getByRole('region', { name: /Practise it/ }).getByRole('link', { name: 'Practise the whole topic' })).toBeVisible();
  await axe(page);

  // your own notes and a link, kept after a reload
  await page.getByLabel('Your notes for this topic').fill('By parts: LIATE to choose u');
  await page.getByLabel('Your notes for this topic').blur();
  await page.getByLabel('Link to add').fill('https://www.youtube.com/watch?v=ueWWMLrR4Ow');
  await page.getByLabel('Name for the link').fill('Parts again');
  await page.getByRole('button', { name: 'Add link' }).click();
  await expect(page.getByRole('button', { name: 'Play video: Parts again' })).toBeVisible();
  await page.getByLabel('Link to add').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Add link' }).click();
  await expect(page.getByText(/doesn’t look like a web address/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Your notes for this topic')).toHaveValue('By parts: LIATE to choose u');
  await expect(page.getByRole('button', { name: 'Play video: Parts again' })).toBeVisible();
  expect(youtube).toEqual([]);

  // it's on the Learn page and in today's plan
  await page.goto('./#/learn');
  await expect(page.getByRole('region', { name: 'Need help' }).getByRole('link', { name: /Integration/ })).toBeVisible();
  await axe(page);
  await page.goto('./#/');
  await expect(page.getByRole('region', { name: 'Your plan for today' }).getByRole('link', { name: /Learn Integration/ })).toBeVisible();
  await page.goto('./#/learn');
  await page.getByRole('button', { name: /Done with Integration/ }).click();
  await expect(page.getByRole('region', { name: 'Need help' })).toContainText('Nothing marked');
});

test('a question you get wrong offers help with its topic', async ({ page }) => {
  await page.goto(`./#/q/${Q}/2`);
  await page.getByLabel('Answer for the question').fill('12345');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('link', { name: /Need help with Integration\?/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Integration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I need help with this' })).toHaveAttribute('aria-pressed', 'true');
});
