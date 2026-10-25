/**
 * Today's plan: a short, ordered list of what's most worth doing today, worked out from everything
 * the app knows — set work and its due date, reviews that are due, mistakes to put right, your
 * weakest topic (from practice and real past papers), flashcards, and how close your exams are.
 * Each item ticks itself off as you do it.
 */
import type { Attempt, CardRecord } from '../storage/types';
import { BANK } from '../content/bank-meta';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { isDue, isQuestionCard, toCard } from '../srs/fsrs';
import { groupBy, mastery } from '../progress/mastery';
import { todayKey } from './dates';
import { lossesByFamily, type PaperResults } from './paper-results';
import { fixedToday, isOpen, mistakesFrom, type MistakeNotes } from './mistakes';

export interface PlanItem {
  id: string;
  title: string;
  detail: string;
  /** app path, e.g. /review */
  path: string;
  query?: Record<string, string | number>;
  minutes: number;
  done: boolean;
}

export interface PlanInput {
  attempts: Attempt[];
  cards: CardRecord[];
  papers: PaperResults;
  notes: MistakeNotes;
  /** set work not handed in yet */
  setWork: { id: string; title: string; due: string | null; minutes: number }[];
  /** exams still to come, soonest first */
  exams: { label: string; days: number }[];
  now?: Date;
}

const DAY = 86_400_000;
const FAMILY_CHAPTER = new Map(BANK.templates.map((t) => [t.family, t.chapter]));
const pct = (x: number) => `${Math.round(100 * x)}%`;

/** The weakest topic worth practising today: weakest practised chapter, else where real papers lose most, else the next new chapter. */
export function focusTopic(attempts: Attempt[], papers: PaperResults): { chapter: string; why: string } | null {
  const byCh = groupBy(attempts, (a) => a.chapter);
  const weak = [...byCh.entries()]
    .filter(([, as]) => as.length >= 2)
    .map(([ch, as]) => ({ ch, m: mastery(as) ?? 1 }))
    .filter((x) => x.m < 0.75)
    .sort((a, b) => a.m - b.m)[0];
  if (weak) return { chapter: weak.ch, why: `${pct(weak.m)} so far — your weakest topic` };
  const lost = lossesByFamily(papers).find((l) => FAMILY_CHAPTER.has(l.family));
  if (lost) return { chapter: FAMILY_CHAPTER.get(lost.family)!, why: `where real papers lose you most marks` };
  const fresh = CHAPTERS.find((c) => !byCh.has(c.ref) && BANK.templates.some((t) => t.chapter === c.ref));
  return fresh ? { chapter: fresh.ref, why: 'a topic you haven’t tried yet' } : null;
}

export function buildPlan(input: PlanInput): PlanItem[] {
  const now = input.now ?? new Date();
  const today = todayKey(now);
  const todays = input.attempts.filter((a) => todayKey(new Date(a.finishedAt)) === today);
  const items: PlanItem[] = [];

  // set work, soonest due first
  for (const w of [...input.setWork].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999')).slice(0, 2)) {
    const days = w.due ? Math.round((new Date(`${w.due}T12:00:00`).getTime() - now.getTime()) / DAY) : null;
    items.push({
      id: `work-${w.id}`,
      title: `Set work: ${w.title}`,
      detail: days === null ? 'Set by your group admin' : days < 0 ? 'Overdue' : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`,
      path: '/group',
      minutes: w.minutes,
      done: false,
    });
  }

  // reviews that are due
  const due = input.cards.filter((c) => isQuestionCard(c) && isDue(c, now)).length;
  const reviewedToday = todays.some((a) => a.mode === 'review');
  if (due || reviewedToday)
    items.push({ id: 'review', title: due ? `Review ${due} topic${due === 1 ? '' : 's'}` : 'Reviews', detail: due ? 'Due now, before you forget them' : 'All caught up', path: '/review', minutes: Math.min(due, 6) * 3 || 3, done: due === 0 });

  // mistakes to put right
  const ms = mistakesFrom(input.attempts);
  const open = ms.filter((m) => isOpen(m, input.notes)).length;
  const fixed = fixedToday(ms, now);
  if (open || fixed) {
    const aim = Math.min(3, open + fixed);
    items.push({ id: 'mistakes', title: `Put right ${aim} mistake${aim === 1 ? '' : 's'}`, detail: fixed ? `${Math.min(fixed, aim)} of ${aim} done` : `${open} in your notebook`, path: '/mistakes', minutes: 10, done: fixed >= aim });
  }

  // the topic that needs it most
  const focus = focusTopic(input.attempts, input.papers);
  if (focus) {
    const n = todays.filter((a) => a.chapter === focus.chapter).length;
    const title = CHAPTER_BY_REF.get(focus.chapter as never)?.title ?? focus.chapter;
    items.push({ id: `focus-${focus.chapter}`, title: `Practise ${title}`, detail: n ? `${Math.min(n, 4)} of 4 questions done` : `4 questions: ${focus.why}`, path: '/practice', query: { c: focus.chapter }, minutes: 15, done: n >= 4 });
  }

  // flashcards that are due
  const flash = input.cards.filter((c) => !isQuestionCard(c) && isDue(c, now)).length;
  const flashedToday = input.cards.some((c) => !isQuestionCard(c) && todayKey(toCard(c).last_review ?? new Date(0)) === today);
  if (flash || flashedToday)
    items.push({ id: 'flash', title: flash ? `${flash} flashcard${flash === 1 ? '' : 's'}` : 'Flashcards', detail: flash ? 'Formulae you must learn' : 'All caught up', path: '/flashcards', minutes: Math.max(2, Math.ceil(flash / 4)), done: flash === 0 });

  // an exam within four weeks: a timed paper each week
  const exam = input.exams[0];
  if (exam && exam.days <= 28) {
    const weekAgo = now.getTime() - 7 * DAY;
    const timed = input.attempts.some((a) => (a.mode === 'mock' || a.mode === 'timed') && a.finishedAt >= weekAgo);
    items.push({ id: 'paper', title: 'A timed paper this week', detail: `${exam.label.split(':')[0]} is in ${exam.days} day${exam.days === 1 ? '' : 's'}`, path: '/exams', minutes: 45, done: timed });
  }
  return items;
}
