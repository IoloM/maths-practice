import type { Response, Verdict } from '../engine/marking/types';

export interface Stroke {
  tool: 'pen' | 'highlighter';
  color: string;
  size: number;
  /** flattened [x, y, pressure, x, y, pressure, …] in canvas CSS pixels */
  points: number[];
}

export type Paper = 'plain' | 'lined' | 'squared';

export interface Working {
  mode: 'write' | 'type';
  strokes: Stroke[];
  annotate: Stroke[];
  text: string;
  paper: Paper;
  height: number;
}

export interface PartAttempt {
  label: string;
  response: Response | null;
  auto: { score: number; max: number; verdict: Verdict; errorId?: string; ft?: boolean } | null;
  self: { score: number; ticks: number[] } | null;
  /** highest hint tier used (0 = none) */
  hints: number;
}

export type Mode = 'practice' | 'mixed' | 'review' | 'mock' | 'timed' | 'daily' | 'shared';

export interface Attempt {
  id?: number;
  templateId: string;
  seed: number;
  family: string;
  spec: string[];
  chapter: string;
  difficulty: number;
  mode: Mode;
  setId?: string;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  marks: number;
  parts: PartAttempt[];
  gaveUp: boolean;
  working?: Working;
}

export interface Draft {
  key: string;
  responses: Record<string, Response>;
  hints: Record<string, number>;
  working?: Working;
  startedAt: number;
  updatedAt: number;
}

export interface CardRecord {
  family: string;
  /** serialised ts-fsrs Card */
  card: Record<string, unknown>;
  updatedAt: number;
}

export interface SetItem {
  templateId: string;
  seed: number;
  /** fixed question id instead of a template */
  fixedId?: string;
}

export interface SetRecord {
  id: string;
  kind: 'mock' | 'timed' | 'daily';
  title: string;
  createdAt: number;
  items: SetItem[];
  durationMin: number;
  startedAt?: number;
  finishedAt?: number;
  status: 'new' | 'running' | 'finished';
  /** responses during an unmarked (exam-conditions) set, keyed `${i}:${label}` */
  responses?: Record<string, Response>;
  /** paper sections as item index ranges [from, to) */
  sections?: { name: string; from: number; to: number }[];
  /** working (handwriting/typed) per item index */
  working?: Record<number, Working>;
  /** work set for the study group (cloud.ts): the result is handed in when it's finished */
  assignmentId?: string;
  /** opened from a "beat my score" link: whose score to beat */
  challenge?: { by: string; got: number; of: number };
  /** a check-in on a topic you said you'd learnt (topics.ts): which topic, and which check-in (0, 1, 2) */
  checkin?: { chapter: string; n: number };
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface BackupFile {
  app: 'maths-practice';
  version: 1;
  exportedAt: string;
  stores: {
    attempts: Attempt[];
    drafts: Draft[];
    cards: CardRecord[];
    sets: SetRecord[];
    settings: Setting[];
  };
}

/** Storage behind an interface so cross-device sync can be added later. */
export interface Store {
  readonly kind: 'indexeddb' | 'memory';
  addAttempt(a: Attempt): Promise<number>;
  updateAttempt(a: Attempt): Promise<void>;
  allAttempts(): Promise<Attempt[]>;
  attemptsFor(templateId: string): Promise<Attempt[]>;
  getDraft(key: string): Promise<Draft | undefined>;
  putDraft(d: Draft): Promise<void>;
  deleteDraft(key: string): Promise<void>;
  getCard(family: string): Promise<CardRecord | undefined>;
  putCard(c: CardRecord): Promise<void>;
  allCards(): Promise<CardRecord[]>;
  getSet(id: string): Promise<SetRecord | undefined>;
  putSet(s: SetRecord): Promise<void>;
  allSets(): Promise<SetRecord[]>;
  getSetting<T>(key: string, fallback: T): Promise<T>;
  putSetting(key: string, value: unknown): Promise<void>;
  exportAll(): Promise<BackupFile>;
  importAll(b: BackupFile, mode: 'replace' | 'merge'): Promise<void>;
  /** delete every attempt, draft, review card, set and setting on this device */
  clearAll(): Promise<void>;
  /** let go of the database (so it can be deleted) */
  close(): void;
}
