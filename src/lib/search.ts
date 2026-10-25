/**
 * Search across the whole app: pages, textbook chapters, specification points, question types,
 * real past-paper questions, the formula booklet and the flashcards. Everything is in the app
 * already, so the index is built on the device the first time you search.
 */
import { BANK } from '../content/bank-meta';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { SPEC } from '../content/spec';
import { PAPER_TITLES, PAST_PAPER_BY_ID, PAST_QUESTIONS } from '../content/past-papers';
import { MECH, PURE, STATS } from '../content/booklet';
import { FLASHCARDS } from '../content/flashcards';

export type HitKind = 'Page' | 'Topic' | 'Spec point' | 'Question type' | 'Past paper' | 'Formula' | 'Flashcard';

export interface Hit {
  kind: HitKind;
  /** may contain $…$ maths */
  title: string;
  sub?: string;
  path: string;
  query?: Record<string, string>;
  /** lower-case text searched (title first) */
  text: string;
  titleText: string;
}

const WEIGHT: Record<HitKind, number> = { Page: 4, Topic: 3, 'Spec point': 2, 'Question type': 2, Formula: 1.5, Flashcard: 1.2, 'Past paper': 1 };

/** Maths written as LaTeX, flattened to words for searching. */
export const plain = (s: string) =>
  s
    .replace(/\\(?:mathrm|text|operatorname|mathbf|left|right|displaystyle|dfrac|frac|tfrac|quad|,|;)/g, ' ')
    .replace(/\\([a-zA-Z]+)/g, ' $1 ')
    .replace(/[${}^_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const PAGES: [string, string, string, Record<string, string>?][] = [
  ['Home', 'Today’s plan, goal and streak', '/'],
  ['Topics', 'Every textbook chapter', '/topics'],
  ['Mock papers and timed sets', 'Exams', '/exams'],
  ['Past papers', 'Every 9MA0 paper, marks and exam mode', '/past-papers'],
  ['Review', 'Spaced repetition: what’s due', '/review'],
  ['Mistake notebook', 'Questions you dropped marks on', '/mistakes'],
  ['Progress', 'Predicted grade, grades over time, chapters', '/progress'],
  ['Formula booklet', 'The exam booklet', '/reference', { tab: 'booklet' }],
  ['Formulae not in the booklet', 'What you must learn', '/reference', { tab: 'learn' }],
  ['Binomial tables', 'Statistical tables', '/reference', { tab: 'binomial' }],
  ['Normal distribution table', 'Statistical tables', '/reference', { tab: 'normal' }],
  ['PMCC critical values', 'Statistical tables', '/reference', { tab: 'pmcc' }],
  ['Calculator tips', 'Using your calculator in the exam', '/reference', { tab: 'calculator' }],
  ['How mark schemes work', 'M, A, B marks; oe, cao, awrt, isw', '/reference', { tab: 'marking' }],
  ['Flashcards', 'Formulae and key facts', '/flashcards'],
  ['Graph plotter', 'Plot functions, sliders for transformations, roots and turning points', '/graphs'],
  ['Large data set explorer', 'Met Office weather data: stats, box plots, scatter, sampling', '/data'],
  ['Settings', 'Theme, answer boxes, exam dates, daily goal, text size', '/settings'],
  ['Study group', 'Leaderboard and set work', '/group'],
  ['Your account', 'Sign in, save, password', '/account'],
];

let index: Hit[] | null = null;

export function searchIndex(): Hit[] {
  if (index) return index;
  const hits: Hit[] = [];
  const add = (kind: HitKind, title: string, sub: string | undefined, path: string, query?: Record<string, string>, extra = '') => {
    const titleText = plain(title);
    hits.push({ kind, title, sub, path, query, titleText, text: `${titleText} ${plain(sub ?? '')} ${plain(extra)}` });
  };
  for (const [t, sub, path, q] of PAGES) add('Page', t, sub, path, q);
  for (const c of CHAPTERS) add('Topic', c.title, `${c.stream} Year ${c.year} · Chapter ${c.n}`, `/chapter/${c.ref}`, undefined, c.sections.join(' '));
  for (const s of SPEC) add('Spec point', s.title, `${s.ref} · ${s.topic}`, '/practice', { s: s.ref }, s.ref);
  for (const e of BANK.templates) {
    const ch = CHAPTER_BY_REF.get(e.chapter);
    add('Question type', e.title, `${ch?.title ?? e.chapter} · ${e.marks} marks`, '/practice', { t: e.id }, `${e.spec.join(' ')} ${e.family.replace(/[.-]/g, ' ')}`);
  }
  for (const q of PAST_QUESTIONS) {
    const p = PAST_PAPER_BY_ID.get(q.paper);
    if (!p) continue;
    add('Past paper', q.topic, `${p.series} ${PAPER_TITLES[p.paper].split(':')[0]} Q${q.q} · ${q.marks} marks`, '/past-papers', { p: p.id });
  }
  for (const g of [...PURE, ...MECH, ...STATS]) for (const [label, tex] of g.f) add('Formula', label || g.h, `${g.h} · in the booklet`, '/reference', { tab: 'booklet' }, tex);
  for (const c of FLASHCARDS) add('Flashcard', c.front, `${c.topic} · ${c.deck === 'learn' ? 'not in the booklet' : 'key fact'}`, '/flashcards', undefined, c.back);
  return (index = hits);
}

/** Best matches first: every word must appear; title matches, whole words and kinds of page rank higher. */
export function search(q: string, limit = 40): Hit[] {
  const words = plain(q).split(' ').filter(Boolean);
  if (!words.length) return [];
  const scored: { h: Hit; s: number }[] = [];
  for (const h of searchIndex()) {
    let s = 0;
    let ok = true;
    for (const w of words) {
      const at = h.text.indexOf(w);
      if (at < 0) {
        ok = false;
        break;
      }
      const inTitle = h.titleText.indexOf(w);
      s += inTitle >= 0 ? 3 + (inTitle === 0 || h.titleText[inTitle - 1] === ' ' ? 2 : 0) : 1;
    }
    if (!ok) continue;
    if (h.titleText.startsWith(words.join(' '))) s += 3;
    scored.push({ h, s: s * WEIGHT[h.kind] - h.titleText.length / 200 });
  }
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.h);
}
