/**
 * Mr Astbury's booklet: answers by part, marked against the worked solution, counted in progress
 * and topics like any question, and shown in the record (the PDF itself is the student's, so it
 * isn't in the tests).
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { plainInput } from './helpers';
import { blankPdf } from './fake-supabase';

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
  await expect(page.getByRole('button', { name: 'Print or save this page as a PDF' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'PDF of this chapter with my working' })).toBeEnabled();
});

/** How much ink a page's writing layer shows (pixels drawn on it). */
const inkOn = (page: import('@playwright/test').Page, name: RegExp) =>
  page.getByRole('img', { name }).evaluate((c) => {
    const cv = c as HTMLCanvasElement;
    const d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });

test('write on the booklet’s pages, then a PDF of the chapter with the working on it for Mr Astbury', async ({ page }) => {
  await page.goto('./#/booklet');
  await page.getByLabel('Mr Astbury – A Level Exam Qs Series – Pure (PDF)').setInputFiles({ name: 'booklet.pdf', mimeType: 'application/pdf', buffer: blankPdf(430) });
  await expect(page.getByText('loaded (booklet.pdf)')).toBeVisible();

  await page.goto('./#/booklet/1.1/1');
  const sheet = /Question 1, its page in the booklet \(booklet page 5\)/;
  const layer = page.getByRole('img', { name: sheet });
  await expect(layer).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'Pen and paper' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Final answers' })).toBeVisible();
  await axe(page);

  // write on the lines with the mouse
  const write = async (y: number) => {
    // bring that part of the page to the middle of the screen first
    await layer.evaluate((el, f) => {
      const r = el.getBoundingClientRect();
      window.scrollBy({ top: r.top + r.height * f - innerHeight / 2, behavior: 'instant' });
    }, y);
    const box = (await layer.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + box.width * (0.2 + i * 0.03), box.y + box.height * (y + (i % 2) * 0.01));
    await page.mouse.up();
  };
  await write(0.45);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await expect.poll(() => inkOn(page, sheet)).toBeGreaterThan(50);
  // undo takes it off, redo puts it back
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => inkOn(page, sheet)).toBe(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => inkOn(page, sheet)).toBeGreaterThan(50);
  // the hand scrolls instead of writing
  await page.getByRole('button', { name: 'Scroll with a finger' }).click();
  const before = await inkOn(page, sheet);
  await write(0.6);
  expect(await inkOn(page, sheet)).toBe(before);
  // a second line, in red
  await page.getByRole('button', { name: 'Pen', exact: true }).click();
  await page.getByRole('button', { name: 'Red ink' }).click();
  await write(0.6);
  await expect.poll(() => inkOn(page, sheet)).toBeGreaterThan(before);

  // the final answers go in the boxes, and the marks as before
  await page.getByRole('textbox', { name: 'Answer to part (a)' }).fill('16 − 4√5');
  await page.getByRole('textbox', { name: 'Answer to part (b)' }).fill('4 − √5');
  await page.getByRole('button', { name: 'Mark my answers' }).click();
  await page.getByRole('button', { name: 'Full marks' }).click();
  await expect(page.getByText('Total: 6/6')).toBeVisible();

  // the writing is kept
  await page.waitForTimeout(800);
  await page.reload();
  await expect.poll(() => inkOn(page, sheet)).toBeGreaterThan(before);
  await expect(page.getByRole('textbox', { name: 'Answer to part (a)' })).toHaveValue('16 − 4√5');

  // a question with only writing on it shows as started
  await page.goto('./#/booklet/1.1/2');
  const layer2 = page.getByRole('img', { name: /Question 2, its page in the booklet/ });
  await expect(layer2).toBeVisible();
  await layer2.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top + r.height * 0.5 - innerHeight / 2, behavior: 'instant' });
  });
  const box2 = (await layer2.boundingBox())!;
  await page.mouse.move(box2.x + box2.width * 0.3, box2.y + box2.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box2.x + box2.width * 0.5, box2.y + box2.height * 0.52);
  await page.mouse.up();
  await page.waitForTimeout(800);
  await page.goto('./#/booklet/1.1');
  await expect(page.getByRole('link', { name: /Q2 .* Started/ })).toBeVisible();

  // the PDF: the chapter's 8 booklet pages with the writing on them, after a front page
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF of this chapter with my working' }).click();
  await expect(page.getByText(/Ready: Mr Astbury 1\.1 Algebraic Expressions.*\.pdf/)).toBeVisible({ timeout: 30_000 });
  if (!fine) await page.getByRole('link', { name: 'Save the PDF' }).click();
  const d = await download;
  expect(d.suggestedFilename()).toMatch(/^Mr Astbury 1\.1 Algebraic Expressions.*\.pdf$/);
  const pdf = await PDFDocument.load(readFileSync((await d.path())!));
  expect(pdf.getPageCount()).toBe(1 + 8);
  expect(pdf.getTitle()).toMatch(/^Mr Astbury 1\.1 Algebraic Expressions/);
  // ink and the answers line on question 1's page (the second page of the PDF); question 3's page is untouched
  const drawn = (i: number) => {
    const c = pdf.getPage(i).node.Contents();
    const list = !c ? [] : c instanceof PDFArray ? c.asArray().map((r) => pdf.context.lookup(r)) : [c];
    return list.map((x) => (x instanceof PDFRawStream ? Buffer.from(decodePDFRawStream(x).decode()).toString('latin1') : '')).join('\n');
  };
  expect(drawn(1)).toContain(' gs');
  expect(drawn(1)).toMatch(/Image-\d+ Do/);
  expect(drawn(3)).toBe('');
  await axe(page);

  // the record shows the page with the writing on it
  await page.goto('./#/booklet/record?s=1.1');
  await expect(page.getByRole('img', { name: 'Question 1 from the booklet (page 5) with the working written on it' })).toBeVisible();
});
