/** Compact authoring for fixed questions. */
import type { ChapterRef, CommandWord, Diagram, FixedQuestion, SpecRef } from '../../engine/templates/types';
import type { SchemeLine } from '../../engine/marking/types';

interface Base {
  id: string;
  title: string;
  spec: SpecRef[];
  chapter: ChapterRef;
  level: 'AS' | 'A2';
  tags: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  commands?: CommandWord[];
  hints: [string, string, string];
  stem?: string;
  diagram?: Diagram;
  family?: string;
  paper?: (1 | 2 | 3)[];
}

const paperFor = (spec: SpecRef[]): (1 | 2 | 3)[] => (/^[SM]/.test(spec[0]) ? [3] : [1, 2]);

/** "M1 text" / "A1* text" / plain text (→ B1). */
function line(p: string, last: boolean): SchemeLine {
  const m = /^(M1|M2|A1|A2|B1|B2|dM1|A1\*|A1ft|B1ft) (.*)$/.exec(p);
  return m ? { code: m[1], text: m[2], ...(last && m[1] === 'A1*' ? { final: true } : {}) } : { code: 'B1', text: p };
}

/** Self-marked: one mark per checklist point. */
export function selfQ(b: Base & { prompt: string; model: string; points: string[] }): FixedQuestion {
  const marks = b.points.reduce((s, p) => s + (/^(M2|A2|B2) /.test(p) ? 2 : 1), 0);
  return {
    id: b.id,
    title: b.title,
    spec: b.spec,
    chapter: b.chapter,
    level: b.level,
    paper: b.paper ?? paperFor(b.spec),
    difficulty: b.difficulty ?? 3,
    marks,
    time: Math.max(1, Math.round(marks * 1.2)),
    commands: b.commands ?? ['Explain'],
    tags: b.tags,
    kind: 'self',
    family: b.family,
    stem: b.stem,
    diagram: b.diagram,
    prompt: b.prompt,
    modelAnswer: b.model,
    checklist: b.points.map((p, i) => line(p, i === b.points.length - 1)),
    hints: b.hints,
  };
}

/** Auto-marked choice: B1 for the right option (plus B1 for the reason when marks = 2). */
export function choiceQ(b: Base & { prompt: string; options: string[]; correct: number | number[]; why: string; marks?: 1 | 2 }): FixedQuestion {
  const correct = Array.isArray(b.correct) ? b.correct : [b.correct];
  const marks = b.marks ?? 1;
  return {
    id: b.id,
    title: b.title,
    spec: b.spec,
    chapter: b.chapter,
    level: b.level,
    paper: b.paper ?? paperFor(b.spec),
    difficulty: b.difficulty ?? 2,
    marks,
    time: Math.max(1, Math.round(marks * 1.2)),
    commands: b.commands ?? ['State'],
    tags: b.tags,
    kind: 'choice',
    family: b.family,
    stem: b.stem,
    diagram: b.diagram,
    prompt: b.prompt,
    options: b.options,
    correct,
    modelAnswer: `${correct.map((i) => b.options[i]).join('; ')}. ${b.why}`,
    checklist: marks === 1 ? [{ code: 'B1', text: b.why }] : [{ code: 'B1', text: `Correct choice: ${correct.map((i) => b.options[i]).join('; ')}` }, { code: 'B1', text: b.why }],
    hints: b.hints,
  };
}
