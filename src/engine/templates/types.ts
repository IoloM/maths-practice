import type { Rng } from '../core/rng';
import type { AnswerSpec, CommonError, FtValue, SchemeLine } from '../marking/types';

export type Book = 'P1' | 'P2' | 'SM1' | 'SM2';
/** e.g. 'P1.13' = Pure Year 1 chapter 13; 'SM1.7' = Stats & Mechanics Year 1 chapter 7. */
export type ChapterRef = `${Book}.${number}`;
/** P = Papers 1/2 Pure, S = Paper 3 Section A Statistics, M = Paper 3 Section B Mechanics. */
export type SpecRef = `${'P' | 'S' | 'M'}${number}.${number}`;

export type CommandWord =
  | 'Find'
  | 'Calculate'
  | 'Show that'
  | 'Hence'
  | 'Hence or otherwise'
  | 'Solve'
  | 'Prove'
  | 'Explain'
  | 'Sketch'
  | 'State'
  | 'Write down'
  | 'Determine'
  | 'Evaluate'
  | 'Simplify'
  | 'Express'
  | 'Use'
  | 'Interpret'
  | 'Test'
  | 'Comment'
  | 'Estimate'
  | 'Verify'
  | 'Integrate'
  | 'Differentiate'
  | 'Expand'
  | 'Factorise'
  | 'Give a reason'
  | 'Suggest'
  | 'Describe';

export interface TemplateMeta {
  id: string;
  /** spaced-repetition grouping: templates practising the same skill */
  family: string;
  title: string;
  spec: SpecRef[];
  chapter: ChapterRef;
  sections?: string[];
  level: 'AS' | 'A2';
  paper: (1 | 2 | 3)[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  marks: number;
  /** minutes */
  time: number;
  commands: CommandWord[];
  tags: string[];
}

/** Follow-through: recompute this part's answer from the student's earlier answers. */
export type FollowThrough = (prev: Record<string, FtValue | undefined>) => AnswerSpec | null;

export interface Part {
  /** 'a', 'b', 'i' … or '' for a single-part question */
  label: string;
  marks: number;
  prompt: string;
  answer: AnswerSpec;
  ft?: FollowThrough;
  scheme: SchemeLine[];
  hints: [string, string, string];
  errors: CommonError[];
  solution: string[];
}

export interface Diagram {
  svg: string;
  alt: string;
}

export interface Instance {
  templateId: string;
  seed: number;
  stem?: string;
  diagram?: Diagram;
  parts: Part[];
  params: Record<string, unknown>;
}

/** What generate() returns; templateId and seed are filled in by the registry. */
export type Generated = Omit<Instance, 'templateId' | 'seed'>;

export interface Template extends TemplateMeta {
  generate(r: Rng): Generated;
  /** independent re-derivation of the answers; throws on failure */
  verify(i: Instance): void;
}

/** Fixed (non-generated) question: proof, explain, modelling, large data set. */
export interface FixedQuestion {
  id: string;
  title: string;
  spec: SpecRef[];
  chapter: ChapterRef;
  sections?: string[];
  level: 'AS' | 'A2';
  paper: (1 | 2 | 3)[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  marks: number;
  time: number;
  commands: CommandWord[];
  tags: string[];
  kind: 'self' | 'choice';
  prompt: string;
  diagram?: Diagram;
  /** for 'choice' */
  options?: string[];
  correct?: number[];
  modelAnswer: string;
  checklist: SchemeLine[];
  hints?: [string, string, string];
}
