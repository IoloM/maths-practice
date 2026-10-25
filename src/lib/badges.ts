/**
 * Badges for milestones, worked out from your progress (nothing extra is saved). The study group
 * sees how many you have; a new one pops up when you earn it.
 */
import type { Attempt, SetRecord } from '../storage/types';
import { CHAPTERS } from '../content/chapters';
import { BANK } from '../content/bank-meta';
import { scoreOf } from '../progress/mastery';
import { todayKey } from './dates';
import { setMarks } from './sets';
import { finishedPapers, paperScore, type PaperResults } from './paper-results';
import { gradeFor } from './grades';
import { mistakesFrom } from './mistakes';

export interface Badge {
  id: string;
  title: string;
  /** how to earn it */
  how: string;
}

interface Facts {
  questions: number;
  bestStreak: number;
  bigFull: boolean;
  bestRun: number;
  chapters: Set<string>;
  mocks: { got: number; of: number }[];
  papers: PaperResults;
  fixed: number;
  reviews: number;
  selfMarked: number;
}

const full = (a: Attempt) => !a.gaveUp && a.marks > 0 && scoreOf(a) >= a.marks;
const PRACTISABLE = new Set(BANK.templates.map((t) => t.chapter));
const streamDone = (f: Facts, stream: string) => CHAPTERS.filter((c) => c.stream === stream && PRACTISABLE.has(c.ref)).every((c) => f.chapters.has(c.ref));

const B = (id: string, title: string, how: string, test: (f: Facts) => boolean) => ({ id, title, how, test });
export const BADGES = [
  B('first', 'First steps', 'Answer your first question', (f) => f.questions >= 1),
  B('q50', 'Fifty', 'Answer 50 questions', (f) => f.questions >= 50),
  B('q100', 'Century', 'Answer 100 questions', (f) => f.questions >= 100),
  B('q500', 'Five hundred', 'Answer 500 questions', (f) => f.questions >= 500),
  B('q1000', 'Thousand club', 'Answer 1,000 questions', (f) => f.questions >= 1000),
  B('streak3', 'On a roll', 'Practise 3 days in a row', (f) => f.bestStreak >= 3),
  B('streak7', 'Week streak', 'Practise 7 days in a row', (f) => f.bestStreak >= 7),
  B('streak30', 'Month streak', 'Practise 30 days in a row', (f) => f.bestStreak >= 30),
  B('run10', 'Ten in a row', 'Full marks on 10 questions in a row', (f) => f.bestRun >= 10),
  B('big', 'Big question', 'Full marks on a 10-mark question, no hints', (f) => f.bigFull),
  B('pure', 'Pure explorer', 'Try every Pure chapter', (f) => streamDone(f, 'Pure')),
  B('stats', 'Statistician', 'Try every Statistics chapter', (f) => streamDone(f, 'Statistics')),
  B('mech', 'Mechanic', 'Try every Mechanics chapter', (f) => streamDone(f, 'Mechanics')),
  B('mock', 'First mock', 'Finish a mock paper', (f) => f.mocks.length > 0),
  B('mockA', 'A-grade mock', 'Get an A or A* on a mock paper', (f) => f.mocks.some((m) => ['A', 'A*'].includes(gradeFor(m.got / m.of)))),
  B('paper', 'The real thing', 'Mark a whole real past paper', (f) => finishedPapers(f.papers).length > 0),
  B('paperStar', 'A* paper', 'Get an A* on a real past paper', (f) => Object.entries(f.papers).some(([id, r]) => paperScore(id, r).grade === 'A*')),
  B('fixer', 'Fixer', 'Put right 10 mistakes', (f) => f.fixed >= 10),
  B('reviewer', 'Never forgets', 'Do 25 review questions', (f) => f.reviews >= 25),
  B('honest', 'Honest marker', 'Self-mark your working on 10 questions', (f) => f.selfMarked >= 10),
] as const;

function longestStreak(attempts: Attempt[]): number {
  const days = [...new Set(attempts.map((a) => todayKey(new Date(a.finishedAt))))].sort();
  let best = 0,
    run = 0,
    prev = '';
  for (const d of days) {
    const next = prev ? todayKey(new Date(new Date(`${prev}T12:00:00`).getTime() + 86_400_000)) : '';
    run = d === next ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function longestRun(attempts: Attempt[]): number {
  let best = 0,
    run = 0;
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    run = full(a) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function earned(input: { attempts: Attempt[]; sets: SetRecord[]; papers: PaperResults }): Badge[] {
  const { attempts, sets, papers } = input;
  const f: Facts = {
    questions: attempts.length,
    bestStreak: longestStreak(attempts),
    bigFull: attempts.some((a) => a.marks >= 10 && full(a) && a.parts.every((p) => !p.hints)),
    bestRun: longestRun(attempts),
    chapters: new Set(attempts.map((a) => a.chapter)),
    mocks: sets
      .filter((s) => s.kind === 'mock' && s.status === 'finished')
      .map((s) => ({ got: attempts.filter((a) => a.setId === s.id).reduce((t, a) => t + scoreOf(a), 0), of: setMarks(s.items) }))
      .filter((m) => m.of > 0),
    papers,
    fixed: mistakesFrom(attempts).filter((m) => m.fixedAt !== null).length,
    reviews: attempts.filter((a) => a.mode === 'review').length,
    selfMarked: attempts.filter((a) => a.parts.some((p) => p.self)).length,
  };
  return BADGES.filter((b) => b.test(f)).map(({ id, title, how }) => ({ id, title, how }));
}
