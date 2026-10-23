/**
 * Predicted grades from mock papers, using real 9MA0 grade boundaries (overall, out of 300).
 * June 2026: Pearson's published GCE grade boundaries. June 2023–2025: Cognito's grade-boundary
 * tables (June 2025 also matches Maths Genie). June 2022 is left out: grading that year was
 * deliberately more generous after the pandemic, so it would flatter a prediction.
 */
export const GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'] as const;
export type Grade = (typeof GRADES)[number] | 'U';

export interface Boundaries {
  series: string;
  max: number;
  marks: Record<(typeof GRADES)[number], number>;
}

export const BOUNDARIES: Boundaries[] = [
  { series: 'June 2026', max: 300, marks: { 'A*': 254, A: 210, B: 173, C: 136, D: 100, E: 64 } },
  { series: 'June 2025', max: 300, marks: { 'A*': 258, A: 214, B: 178, C: 142, D: 106, E: 71 } },
  { series: 'June 2024', max: 300, marks: { 'A*': 251, A: 205, B: 167, C: 130, D: 93, E: 56 } },
  { series: 'June 2023', max: 300, marks: { 'A*': 244, A: 196, B: 158, C: 121, D: 84, E: 47 } },
];
export const LATEST = BOUNDARIES[0];

/** Grade for a fraction of the marks (0–1) on a series' boundaries. */
export function gradeFor(frac: number, b: Boundaries = LATEST): Grade {
  for (const g of GRADES) if (frac * b.max >= b.marks[g] - 1e-9) return g;
  return 'U';
}

/** Fraction of the marks needed for a grade. */
export const needed = (g: (typeof GRADES)[number], b: Boundaries = LATEST) => b.marks[g] / b.max;

export interface MockResult {
  got: number;
  of: number;
  finishedAt: number;
}

export interface Prediction {
  frac: number;
  /** marks the prediction is based on */
  marks: number;
  papers: number;
  grade: Grade;
  /** lowest and highest grade across the recent series' boundaries */
  range: [Grade, Grade];
  /** the next grade up and the extra share of the marks it needs */
  next?: { grade: (typeof GRADES)[number]; gap: number };
}

/** Use the most recent mocks covering at least `window` marks (three full papers = 300). */
export function predict(mocks: MockResult[], window = 300): Prediction | null {
  const recent = [...mocks].filter((m) => m.of > 0).sort((a, b) => b.finishedAt - a.finishedAt);
  const used: MockResult[] = [];
  let of = 0;
  for (const m of recent) {
    if (of >= window) break;
    used.push(m);
    of += m.of;
  }
  if (!used.length) return null;
  const got = used.reduce((s, m) => s + m.got, 0);
  const frac = got / of;
  const grades = BOUNDARIES.map((b) => gradeFor(frac, b));
  const rank = (g: Grade) => (g === 'U' ? GRADES.length : GRADES.indexOf(g));
  const sorted = [...grades].sort((a, b) => rank(b) - rank(a));
  const grade = gradeFor(frac);
  const i = rank(grade);
  const up = i > 0 ? GRADES[i - 1] : undefined;
  return {
    frac,
    marks: of,
    papers: used.length,
    grade,
    range: [sorted[0], sorted[sorted.length - 1]],
    next: up ? { grade: up, gap: needed(up) - frac } : undefined,
  };
}
