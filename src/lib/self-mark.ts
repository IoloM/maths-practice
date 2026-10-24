/**
 * Marking your own working against an Edexcel-style mark scheme: what each code means, which marks
 * hang on an earlier method mark, and which you can give yourself when the final answer was wrong.
 */
import { codeMarks, selfAwardable } from '../engine/marking/mark';
import type { SchemeLine } from '../engine/marking/types';

export type MarkKind = 'M' | 'dM' | 'A' | 'Aft' | 'Acso' | 'B' | 'Bft';

export function kindOf(code: string): MarkKind {
  if (/^dM/.test(code)) return 'dM';
  if (/^M/.test(code)) return 'M';
  if (/^A/.test(code)) return /\*|cso/.test(code) ? 'Acso' : /ft/.test(code) ? 'Aft' : 'A';
  return /ft/.test(code) ? 'Bft' : 'B';
}

/** One line on what earns each kind of mark (shown under every scheme line). */
export const KIND: Record<MarkKind, { name: string; short: string }> = {
  M: { name: 'Method', short: 'Method: the right method for this step, even if you then slip with the numbers' },
  dM: { name: 'Dependent method', short: 'Method that only counts if you earned the method mark before it' },
  A: { name: 'Accuracy', short: 'Accuracy: the correct result at this step, from a correct method' },
  Aft: { name: 'Follow-through', short: 'Follow-through: correct from your own earlier answer, even if that was wrong' },
  Acso: { name: 'Answer given', short: 'Answer given: every step shown, with no errors anywhere' },
  B: { name: 'Independent', short: 'Independent: for this result or statement, however you got it' },
  Bft: { name: 'Independent follow-through', short: 'Independent: for this result worked out from your own earlier answer' },
};

/**
 * The method mark each line depends on (its index), or null. As in Edexcel schemes, accuracy marks
 * and dependent method marks need the method mark before them.
 */
export function dependencies(lines: SchemeLine[]): (number | null)[] {
  let lastM: number | null = null;
  return lines.map((l, i) => {
    const k = kindOf(l.code);
    const dep = k === 'M' || k === 'B' || k === 'Bft' ? null : lastM;
    if (k === 'M' || k === 'dM') lastM = i;
    return dep;
  });
}

/**
 * Lines you may give yourself. Where the app can't check the answer at all (a proof or an
 * explanation) that's every line; otherwise every line but the final answer mark.
 */
export function awardable(lines: SchemeLine[], wholePart = false): boolean[] {
  return wholePart ? lines.map(() => true) : selfAwardable(lines);
}

/** Tick or untick a line. Ticking also gives the method marks it relies on; unticking takes away the marks that rely on it. */
export function toggleTick(lines: SchemeLine[], ticks: boolean[], i: number, on: boolean, wholePart = false): boolean[] {
  const ok = awardable(lines, wholePart);
  const deps = dependencies(lines);
  const next = lines.map((_, k) => !!ticks[k] && ok[k]);
  if (on && ok[i]) {
    for (let k: number | null = i; k !== null; k = deps[k]) if (ok[k]) next[k] = true;
  } else if (!on) next[i] = false;
  for (let k = 0; k < lines.length; k++) if (deps[k] !== null && !next[deps[k]!]) next[k] = false;
  return next;
}

/** Marks from your ticks: a line counts if you may give it yourself and the mark it relies on counts too. */
export function selfScore(lines: SchemeLine[], ticks: boolean[], wholePart = false): number {
  const ok = awardable(lines, wholePart);
  const deps = dependencies(lines);
  const counts: boolean[] = [];
  let total = 0;
  lines.forEach((l, i) => {
    counts[i] = !!ticks[i] && ok[i] && (deps[i] === null || counts[deps[i]!]);
    if (counts[i]) total += codeMarks(l.code);
  });
  return total;
}

/** The most you can give yourself on this part. */
export function selfAvailable(lines: SchemeLine[], wholePart = false): number {
  const ok = awardable(lines, wholePart);
  return lines.reduce((t, l, i) => t + (ok[i] ? codeMarks(l.code) : 0), 0);
}

/** How Edexcel mark schemes work: the codes and the abbreviations examiners use. */
export const GUIDE: { codes: [string, string][]; terms: [string, string][]; tips: string[] } = {
  codes: [
    ['M', 'Method mark. For a correct method applied to the right values. Slips in arithmetic don’t lose it, but the method must be the one the question needs.'],
    ['dM', 'Dependent method mark. Only awarded if the method mark before it was earned.'],
    ['A', 'Accuracy mark. For a correct answer or step. Accuracy marks need the method mark they follow, so a right answer from a wrong method scores nothing.'],
    ['A ft', 'Follow-through. Accuracy marks for correctly using your own earlier (wrong) answer, so one mistake isn’t punished twice.'],
    ['A* or A1 cso', 'Answer given in the question (“show that”). Every step must be shown and correct: no mistakes anywhere, even ones that cancel out.'],
    ['B', 'Independent mark. For a correct value or statement, however it was found.'],
  ],
  terms: [
    ['oe', 'or equivalent: any correct equivalent form is fine'],
    ['cao', 'correct answer only: this exact answer, nothing else'],
    ['cso', 'correct solution only: no errors anywhere in the working'],
    ['awrt', 'answers which round to: e.g. awrt 2.35 accepts 2.3487 or 2.352'],
    ['isw', 'ignore subsequent working: a correct answer stays right even if you then do something odd with it'],
    ['ft', 'follow through from your own earlier answer'],
    ['SC', 'special case: a mark for a common partial approach'],
    ['dp, sf', 'decimal places, significant figures'],
  ],
  tips: [
    'Give yourself a method mark when your working shows that step, even if a number went wrong after it.',
    'Accuracy marks need the method mark before them: ticking one gives you its method mark too.',
    'The final answer mark needs the right answer. If the checker marked yours wrong, it stays off — only tick what your working really shows.',
    'For “show that” questions, every line must be there. A missing step means the last mark is lost.',
  ],
};
