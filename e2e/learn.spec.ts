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
  // Bicen Maths: the whole chapter first, then section by section with practice for each
  await expect(page.getByRole('region', { name: 'Start here: the whole chapter' }).getByRole('button', { name: /Integration \(Year 2\) in 1 hour/ })).toBeVisible();
  const videos = page.getByRole('region', { name: 'Section by section' });
  await expect(videos.getByRole('heading', { name: '11.6 Integration by parts' })).toBeVisible();
  await expect(videos.getByRole('button', { name: /By Parts pt\. 1$/ })).toBeVisible();
  await expect(videos.getByRole('link', { name: /^Practise 11\.6:/ })).toBeVisible();
  await videos.getByRole('checkbox', { name: 'Watched: 13. By Parts pt. 1' }).check();
  await expect(videos).toContainText('1 of 30 videos watched');
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
  await expect(page.getByRole('region', { name: 'Section by section' })).toContainText('1 of 30 videos watched');
  expect(youtube).toEqual([]);

  // it's on the Learn page and in today's plan
  await page.goto('./#/learn');
  await expect(page.getByRole('region', { name: 'Need help' }).getByRole('link', { name: /Integration/ })).toContainText('1/30 videos watched');
  await expect(page.getByRole('region', { name: 'Pure Year 2' }).getByRole('link', { name: /Integration/ })).toContainText('1/30 watched');
  await axe(page);
  await page.goto('./#/');
  await expect(page.getByRole('region', { name: 'Your plan for today' }).getByRole('link', { name: /Learn Integration/ })).toBeVisible();
  await page.goto('./#/learn');
  await page.getByRole('button', { name: /I’ve learnt Integration/ }).click();
  await expect(page.getByRole('region', { name: 'Need help' })).toContainText('Nothing marked');
  await expect(page.getByRole('region', { name: 'Check-ins' })).toContainText(/Integration · check-in 1 of 3 on/);
});

test('check-ins: three days after learning a topic, a short check; doing badly offers help again', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/learn/SM1.6');
  await page.getByRole('button', { name: 'I want to learn this' }).click();
  await page.getByRole('button', { name: /I’ve learnt it/ }).click();
  await expect(page.getByText(/Learnt on .* Check-ins: none yet · next on/)).toBeVisible();
  await page.clock.fastForward(73 * 3600_000);
  await page.goto('./#/');
  await page.getByRole('region', { name: 'Your plan for today' }).getByRole('link', { name: /Check-in: Statistical distributions/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Check-in 1: Statistical distributions' })).toBeVisible();
  await page.getByRole('button', { name: /Start — the timer begins now/ }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Finish & mark/ }).first().click();
  const result = page.getByRole('status').filter({ hasText: /Check-in 1 of 3 on Statistical distributions: 0\/\d+/ });
  await expect(result).toBeVisible();
  await result.getByRole('button', { name: /Mark it “need help” again/ }).click();
  await expect(result.getByRole('button', { name: 'Marked: need help' })).toBeDisabled();
  await page.goto('./#/learn');
  await expect(page.getByRole('region', { name: 'Need help' }).getByRole('link', { name: /Statistical distributions/ })).toBeVisible();
});

test('confidence vs reality: a topic you feel sure about but drop marks on is flagged', async ({ page }) => {
  for (const seed of [2, 3]) {
    await page.goto(`./#/q/${Q}/${seed}`);
    await page.getByLabel('Answer for the question').fill('12345');
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText('Incorrect')).toBeVisible();
  }
  await page.goto('./#/confidence');
  await page.getByRole('group', { name: 'How confident are you with Integration?' }).first().getByRole('button', { name: 'Confident' }).click();
  const over = page.getByRole('region', { name: 'More confident than your marks' });
  await expect(over).toContainText('Integration');
  await expect(over).toContainText('0% of the marks');
  await axe(page);
  await over.getByRole('button', { name: 'Mark: need help' }).click();
  await expect(over.getByRole('button', { name: 'Marked: need help' })).toBeVisible();
});

test('a question you get wrong offers help with its topic', async ({ page }) => {
  await page.goto(`./#/q/${Q}/2`);
  await page.getByLabel('Answer for the question').fill('12345');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('link', { name: /Need help with Integration\?/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Integration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I need help with this' })).toHaveAttribute('aria-pressed', 'true');
});

test('playing a video plays it on the page and ticks it watched', async ({ page }) => {
  await page.route(/youtube-nocookie\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>video</p>' }));
  await page.goto('./#/learn/P1.2');
  const videos = page.getByRole('region', { name: 'Section by section' });
  await expect(videos.getByRole('heading', { name: '2.2 Completing the square' })).toBeVisible();
  await videos.getByRole('button', { name: /3\. Completing the Square$/ }).click();
  await expect(videos.locator('iframe[src*="/embed/5GSoMAVQ7cM"]')).toHaveCount(1);
  await expect(videos.getByRole('checkbox', { name: 'Watched: 3. Completing the Square' })).toBeChecked();
  await expect(videos).toContainText('1 of 13 videos watched');
  await axe(page);
  // one at a time
  await videos.getByRole('button', { name: /9\. The Discriminant$/ }).click();
  await expect(videos.locator('iframe')).toHaveCount(1);
});
