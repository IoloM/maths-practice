/**
 * Predicted grades from mock papers, using real grade boundaries: 9MA0 A level (overall, out of
 * 300) and 8MA0 AS (out of 160). All from Pearson's published GCE grade boundaries (June 2023–2026
 * also match Cognito and Maths Genie). Predictions use June 2023 onwards; earlier series (June 2022
 * was deliberately more generous after the pandemic, and 2018–2021 had small or unusual entries)
 * are kept only to grade a past paper from that series.
 */
import type { Course } from './course';

export const GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'] as const;
export type Grade = (typeof GRADES)[number] | 'U';

export interface Boundaries {
  series: string;
  max: number;
  marks: Record<(typeof GRADES)[number], number>;
}

/** AS has no A*. */
export interface ASBoundaries {
  series: string;
  max: number;
  marks: Record<Exclude<(typeof GRADES)[number], 'A*'>, number>;
}

export const BOUNDARIES: Boundaries[] = [
  { series: 'June 2026', max: 300, marks: { 'A*': 254, A: 210, B: 173, C: 136, D: 100, E: 64 } },
  { series: 'June 2025', max: 300, marks: { 'A*': 258, A: 214, B: 178, C: 142, D: 106, E: 71 } },
  { series: 'June 2024', max: 300, marks: { 'A*': 251, A: 205, B: 167, C: 130, D: 93, E: 56 } },
  { series: 'June 2023', max: 300, marks: { 'A*': 244, A: 196, B: 158, C: 121, D: 84, E: 47 } },
];
export const LATEST = BOUNDARIES[0];

/** AS Mathematics (8MA0) overall, out of 160: Pearson's published GCE grade boundaries. */
export const AS_BOUNDARIES: ASBoundaries[] = [
  { series: 'June 2026', max: 160, marks: { A: 113, B: 99, C: 85, D: 71, E: 58 } },
  { series: 'June 2025', max: 160, marks: { A: 108, B: 95, C: 82, D: 69, E: 57 } },
  { series: 'June 2024', max: 160, marks: { A: 105, B: 90, C: 75, D: 61, E: 47 } },
  { series: 'June 2023', max: 160, marks: { A: 103, B: 90, C: 77, D: 64, E: 52 } },
];
export const AS_LATEST = AS_BOUNDARIES[0];

/** Earlier series, only for grading a past paper from that series ('October 2021' is Pearson's November 2021 series). */
export const OLDER_BOUNDARIES: Boundaries[] = [
  { series: 'June 2022', max: 300, marks: { 'A*': 217, A: 164, B: 130, C: 96, D: 62, E: 28 } },
  { series: 'October 2021', max: 300, marks: { 'A*': 207, A: 157, B: 128, C: 99, D: 70, E: 42 } },
  { series: 'October 2020', max: 300, marks: { 'A*': 214, A: 162, B: 130, C: 99, D: 68, E: 37 } },
  { series: 'June 2019', max: 300, marks: { 'A*': 217, A: 165, B: 134, C: 103, D: 73, E: 43 } },
  { series: 'June 2018', max: 300, marks: { 'A*': 229, A: 184, B: 155, C: 126, D: 98, E: 70 } },
];
export const AS_OLDER_BOUNDARIES: ASBoundaries[] = [
  { series: 'June 2022', max: 160, marks: { A: 95, B: 80, C: 65, D: 50, E: 36 } },
  { series: 'October 2021', max: 160, marks: { A: 91, B: 76, C: 61, D: 46, E: 32 } },
  { series: 'October 2020', max: 160, marks: { A: 93, B: 76, C: 59, D: 43, E: 27 } },
  { series: 'June 2019', max: 160, marks: { A: 101, B: 87, C: 74, D: 61, E: 48 } },
  { series: 'June 2018', max: 160, marks: { A: 105, B: 90, C: 75, D: 61, E: 47 } },
];

/** Grade for a fraction of the marks (0–1) on a series' boundaries. */
export function gradeFor(frac: number, b: Boundaries | ASBoundaries = LATEST): Grade {
  for (const g of GRADES) if (g in b.marks && frac * b.max >= (b.marks as Boundaries['marks'])[g] - 1e-9) return g;
  return 'U';
}

/** Fraction of the marks needed for a grade (more than all of them for an A* at AS). */
export const needed = (g: (typeof GRADES)[number], b: Boundaries | ASBoundaries = LATEST) => ((b.marks as Partial<Boundaries['marks']>)[g] ?? Infinity) / b.max;

/** The boundaries, grades and full-set size (three papers, or both AS papers) for a course. */
export function gradeTables(course: Course = 'alevel') {
  return course === 'as'
    ? { list: AS_BOUNDARIES as (Boundaries | ASBoundaries)[], latest: AS_LATEST as Boundaries | ASBoundaries, grades: GRADES.filter((g) => g !== 'A*'), full: 160, code: '8MA0' }
    : { list: BOUNDARIES as (Boundaries | ASBoundaries)[], latest: LATEST as Boundaries | ASBoundaries, grades: [...GRADES], full: 300, code: '9MA0' };
}

export interface MockResult {
  got: number;
  of: number;
  finishedAt: number;
  /** an app mock, or a real past paper marked with the official scheme */
  kind?: 'mock' | 'paper';
}

export interface Prediction {
  frac: number;
  /** marks the prediction is based on */
  marks: number;
  papers: number;
  /** how many of those were real past papers */
  real: number;
  grade: Grade;
  /** lowest and highest grade across the recent series' boundaries */
  range: [Grade, Grade];
  /** the next grade up and the extra share of the marks it needs */
  next?: { grade: (typeof GRADES)[number]; gap: number };
}

/**
 * Use the most recent mocks and real past papers covering at least `window` marks (three full
 * A level papers = 300; both AS papers = 160), graded on that course's boundaries.
 */
export function predict(mocks: MockResult[], window?: number, course: Course = 'alevel'): Prediction | null {
  const t = gradeTables(course);
  const recent = [...mocks].filter((m) => m.of > 0).sort((a, b) => b.finishedAt - a.finishedAt);
  const used: MockResult[] = [];
  let of = 0;
  for (const m of recent) {
    if (of >= (window ?? t.full)) break;
    used.push(m);
    of += m.of;
  }
  if (!used.length) return null;
  const got = used.reduce((s, m) => s + m.got, 0);
  const frac = got / of;
  const grades = t.list.map((b) => gradeFor(frac, b));
  const rank = (g: Grade) => (g === 'U' ? t.grades.length : t.grades.indexOf(g));
  const sorted = [...grades].sort((a, b) => rank(b) - rank(a));
  const grade = gradeFor(frac, t.latest);
  const i = rank(grade);
  const up = i > 0 ? t.grades[i - 1] : undefined;
  return {
    frac,
    marks: of,
    papers: used.length,
    real: used.filter((m) => m.kind === 'paper').length,
    grade,
    range: [sorted[0], sorted[sorted.length - 1]],
    next: up ? { grade: up, gap: needed(up, t.latest) - frac } : undefined,
  };
}
