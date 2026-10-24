/**
 * What a signed-in person shares with admins about their work (supabase `activity` table: they see
 * their own, admins see everyone's): recent questions, how each chapter is going, real past papers
 * and mock/timed sets. Built from their snapshot when they save; small, and no answers or working.
 */
import type { Snapshot } from './sync-merge';
import type { PaperResults } from './paper-results';
import { paperScore } from './paper-results';
import { ENTRY_BY_ID } from '../content/bank-meta';
import { CHAPTER_BY_REF } from '../content/chapters';
import { scoreOf } from '../progress/mastery';
import { setMarks } from './sets';
import { thisWeek, streak } from './streak';

export interface ActivityDetail {
  updatedAt: number;
  totals: { questions: number; marks: number; scored: number; minutes: number; streak: number; week: { questions: number; marks: number; scored: number } };
  /** newest first */
  recent: { title: string; chapter: string; scored: number; marks: number; at: number; mode: string; minutes: number }[];
  /** every chapter practised: questions, % of marks, last practised */
  chapters: { chapter: string; title: string; questions: number; pct: number; last: number }[];
  papers: { id: string; got: number; of: number; max: number; complete: boolean; done?: string; at: number }[];
  sets: { title: string; kind: string; got: number; of: number; at: number }[];
}

export function buildActivity(s: Snapshot, papers: PaperResults, now = new Date()): ActivityDetail {
  const attempts = [...s.attempts].sort((a, b) => b.finishedAt - a.finishedAt);
  const byChapter = new Map<string, { n: number; m: number; g: number; last: number }>();
  for (const a of attempts) {
    const c = byChapter.get(a.chapter) ?? { n: 0, m: 0, g: 0, last: 0 };
    c.n++;
    c.m += a.marks;
    c.g += scoreOf(a);
    c.last = Math.max(c.last, a.finishedAt);
    byChapter.set(a.chapter, c);
  }
  const week = thisWeek(s.attempts, now);
  return {
    updatedAt: now.getTime(),
    totals: {
      questions: attempts.length,
      marks: attempts.reduce((t, a) => t + a.marks, 0),
      scored: attempts.reduce((t, a) => t + scoreOf(a), 0),
      minutes: Math.round(attempts.reduce((t, a) => t + a.durationMs, 0) / 60_000),
      streak: streak(s.attempts, now),
      week: { questions: week.questions, marks: week.marks, scored: week.scored },
    },
    recent: attempts.slice(0, 30).map((a) => ({
      title: ENTRY_BY_ID.get(a.templateId)?.title ?? a.templateId,
      chapter: a.chapter,
      scored: scoreOf(a),
      marks: a.marks,
      at: a.finishedAt,
      mode: a.mode,
      minutes: Math.round(a.durationMs / 60_000),
    })),
    chapters: [...byChapter.entries()]
      .map(([chapter, c]) => ({ chapter, title: CHAPTER_BY_REF.get(chapter as never)?.title ?? chapter, questions: c.n, pct: c.m ? Math.round((100 * c.g) / c.m) : 0, last: c.last }))
      .sort((a, b) => a.pct - b.pct),
    papers: Object.entries(papers)
      .map(([id, r]) => {
        const sc = paperScore(id, r);
        return { id, got: sc.got, of: sc.of, max: sc.max, complete: sc.complete, done: r.done, at: r.updatedAt };
      })
      .filter((p) => p.of > 0)
      .sort((a, b) => b.at - a.at),
    sets: s.sets
      .filter((x) => x.status === 'finished' && x.kind !== 'daily')
      .map((x) => ({
        title: x.title,
        kind: x.kind,
        got: s.attempts.filter((a) => a.setId === x.id).reduce((t, a) => t + scoreOf(a), 0),
        of: setMarks(x.items),
        at: x.finishedAt ?? x.createdAt,
      }))
      .sort((a, b) => b.at - a.at)
      .slice(0, 15),
  };
}
