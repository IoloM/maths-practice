/**
 * Question sets: mock papers, timed sets and the daily set.
 * Building is deterministic given a random function, so sets can be reproduced and shared.
 */
import { BANK, type BankEntry } from '../content/bank';
import { CHAPTER_BY_REF } from '../content/chapters';
import type { Instance } from '../engine/templates/types';
import type { FtValue, MarkResult, Response } from '../engine/marking/types';
import { markPart } from '../engine/marking/mark';
import type { Attempt, CardRecord, SetItem, SetRecord } from '../storage/types';
import { partAttemptFrom } from './attempt';
import { mastery } from '../progress/mastery';
import { isDue, toCard } from '../srs/fsrs';

/** Edexcel: 1.2 minutes per mark (120 minutes for 100 marks). */
export const MINUTES_PER_MARK = 1.2;

export interface PaperSection {
  name: string;
  marks: number;
  filter: (e: BankEntry) => boolean;
}
export interface PaperSpec {
  id: string;
  title: string;
  sections: PaperSection[];
}

const stream = (e: BankEntry) => CHAPTER_BY_REF.get(e.chapter)?.stream;
const isPure = (e: BankEntry) => stream(e) === 'Pure';
const isStats = (e: BankEntry) => stream(e) === 'Statistics';
const isMech = (e: BankEntry) => stream(e) === 'Mechanics';

export const PAPERS: PaperSpec[] = [
  { id: 'p1', title: 'Paper 1: Pure Mathematics 1', sections: [{ name: 'Pure Mathematics', marks: 100, filter: (e) => isPure(e) && e.paper.includes(1) }] },
  { id: 'p2', title: 'Paper 2: Pure Mathematics 2', sections: [{ name: 'Pure Mathematics', marks: 100, filter: (e) => isPure(e) && e.paper.includes(2) }] },
  {
    id: 'p3',
    title: 'Paper 3: Statistics and Mechanics',
    sections: [
      { name: 'Section A: Statistics', marks: 50, filter: isStats },
      { name: 'Section B: Mechanics', marks: 50, filter: isMech },
    ],
  },
  { id: 'p1-half', title: 'Half paper: Pure (50 marks)', sections: [{ name: 'Pure Mathematics', marks: 50, filter: isPure }] },
  { id: 'p3-stats', title: 'Section practice: Statistics (50 marks)', sections: [{ name: 'Statistics', marks: 50, filter: isStats }] },
  { id: 'p3-mech', title: 'Section practice: Mechanics (50 marks)', sections: [{ name: 'Mechanics', marks: 50, filter: isMech }] },
];

/** Small seeded generator (mulberry32) so sets are reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose templates totalling exactly `target` marks where possible: one per family, spread across
 * chapters, then fill any gap; ordered easier → harder like an exam paper.
 */
export function fillToMarks(pool: BankEntry[], target: number, rnd: () => number, maxFixedShare = 0.15): BankEntry[] {
  const shuffled = shuffle(pool, rnd);
  const chosen: BankEntry[] = [];
  const families = new Set<string>();
  const perChapter = new Map<string, number>();
  const maxPerChapter = Math.max(1, Math.round(target / 22));
  let total = 0,
    fixedMarks = 0;
  const canAdd = (e: BankEntry, strict: boolean) => {
    if (chosen.includes(e) || total + e.marks > target) return false;
    if (e.fixed && fixedMarks + e.marks > target * maxFixedShare) return false;
    if (strict && (families.has(e.family) || (perChapter.get(e.chapter) ?? 0) >= maxPerChapter)) return false;
    return true;
  };
  const add = (e: BankEntry) => {
    chosen.push(e);
    families.add(e.family);
    perChapter.set(e.chapter, (perChapter.get(e.chapter) ?? 0) + 1);
    total += e.marks;
    if (e.fixed) fixedMarks += e.marks;
  };
  for (const e of shuffled) {
    if (total >= target - 2) break;
    if (canAdd(e, true)) add(e);
  }
  // fill the gap: exact fit first, then the largest that fits
  for (let guard = 0; total < target && guard < 20; guard++) {
    const gap = target - total;
    const fits = shuffled.filter((e) => canAdd(e, false));
    if (!fits.length) break;
    const exact = fits.find((e) => e.marks === gap && !families.has(e.family)) ?? fits.find((e) => e.marks === gap);
    add(exact ?? fits.reduce((a, b) => (b.marks > a.marks ? b : a)));
  }
  return chosen.sort((a, b) => a.difficulty - b.difficulty || a.marks - b.marks);
}

const pickSeed = (e: BankEntry, rnd: () => number) => e.seeds[Math.floor(rnd() * e.seeds.length)];

function group<T, K>(xs: T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of xs) {
    const k = key(x);
    m.set(k, [...(m.get(k) ?? []), x]);
  }
  return m;
}

export interface SetSection {
  name: string;
  from: number;
  to: number;
}

/** Items (and section boundaries) for a paper. */
export function buildPaper(paper: PaperSpec, seed: number): { items: SetItem[]; sections: SetSection[]; marks: number } {
  const rnd = rng(seed);
  const items: SetItem[] = [];
  const sections: SetSection[] = [];
  let marks = 0;
  for (const s of paper.sections) {
    const chosen = fillToMarks(BANK.templates.filter(s.filter), s.marks, rnd);
    sections.push({ name: s.name, from: items.length, to: items.length + chosen.length });
    for (const e of chosen) {
      items.push({ templateId: e.id, seed: pickSeed(e, rnd) });
      marks += e.marks;
    }
  }
  return { items, sections, marks };
}

/** Items for a timed set from a pool (chapters / streams) and a mark target. */
export function buildTimed(pool: BankEntry[], targetMarks: number, seed: number): SetItem[] {
  const rnd = rng(seed);
  return fillToMarks(pool, targetMarks, rnd, 0.25).map((e) => ({ templateId: e.id, seed: pickSeed(e, rnd) }));
}

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Today's set (5 questions, about 20–25 marks): due reviews first, then the weakest chapters you
 * have practised, then new chapters. Deterministic for the day and the progress so far.
 */
export function buildDaily(day: string, attempts: Attempt[], cards: CardRecord[], size = 5): SetItem[] {
  const rnd = rng(hashString(`daily:${day}`));
  const gen = BANK.templates.filter((e) => !e.fixed);
  const byFamily = group(gen, (e) => e.family);
  const picks: BankEntry[] = [];
  const used = new Set<string>();
  const take = (e: BankEntry | undefined) => {
    if (e && !used.has(e.family) && picks.length < size) {
      picks.push(e);
      used.add(e.family);
    }
  };
  // 1. due review families, most overdue first
  const due = cards.filter((c) => isDue(c)).sort((a, b) => toCard(a).due.getTime() - toCard(b).due.getTime());
  for (const c of due.slice(0, 2)) {
    const es = byFamily.get(c.family);
    if (es) take(es[Math.floor(rnd() * es.length)]);
  }
  // 2. weakest practised chapters
  const byCh = group(attempts, (a) => a.chapter);
  const weak = [...byCh.entries()].map(([ch, as]) => ({ ch, m: mastery(as) ?? 1 })).sort((a, b) => a.m - b.m);
  for (const w of weak.slice(0, 2)) {
    const es = shuffle(gen.filter((e) => e.chapter === w.ch && !used.has(e.family)), rnd);
    take(es[0]);
  }
  // 3. fill with chapters not yet tried (or anything)
  const tried = new Set(byCh.keys());
  for (const e of shuffle(gen.filter((e) => !tried.has(e.chapter)), rnd)) take(e);
  for (const e of shuffle(gen, rnd)) take(e);
  return picks.map((e) => ({ templateId: e.id, seed: pickSeed(e, rnd) }));
}

export function newSetId(kind: SetRecord['kind']): string {
  return `${kind}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

export const setMarks = (items: SetItem[]) => items.reduce((s, it) => s + (BANK.templates.find((e) => e.id === it.templateId)?.marks ?? 0), 0);

/** Share format: `kind~minutes~id:seed,id:seed…` (ids never contain ~ , or :). */
export function encodeSet(s: Pick<SetRecord, 'kind' | 'durationMin' | 'items' | 'title'>): string {
  return [s.kind, s.durationMin, s.items.map((i) => `${i.templateId}:${i.seed}`).join(','), encodeURIComponent(s.title)].join('~');
}
export function decodeSet(code: string): Pick<SetRecord, 'kind' | 'durationMin' | 'items' | 'title'> | null {
  const [kind, min, items, title] = code.split('~');
  if (!['mock', 'timed', 'daily'].includes(kind) || !items) return null;
  const parsed = items.split(',').map((x) => {
    const [templateId, seed] = x.split(':');
    return { templateId, seed: Number(seed) };
  });
  if (parsed.some((p) => !p.templateId || !Number.isFinite(p.seed))) return null;
  return { kind: kind as SetRecord['kind'], durationMin: Number(min) || 0, items: parsed, title: title ? decodeURIComponent(title) : 'Shared set' };
}

/** Mark every part of an instance from stored responses, following through in order. */
export function markInstance(inst: Instance, responses: Record<string, Response | undefined>): MarkResult[] {
  const prev: Record<string, FtValue | undefined> = {};
  return inst.parts.map((p) => {
    const rr = markPart(p, responses[p.label], prev);
    prev[p.label] = rr.value ? { ...rr.value, correct: rr.verdict === 'correct' && !rr.ft } : { correct: rr.verdict === 'correct' };
    return rr;
  });
}

/** Attempt records for a finished exam-style set (no hints; time shared out by marks). */
export function attemptsForSet(set: SetRecord, insts: Instance[], metas: BankEntry[], totalMs: number): Attempt[] {
  const marksAll = metas.reduce((s, m) => s + m.marks, 0) || 1;
  return insts.map((inst, i) => {
    const meta = metas[i];
    const responses: Record<string, Response | undefined> = {};
    for (const p of inst.parts) responses[p.label] = set.responses?.[`${i}:${p.label}`];
    const results = markInstance(inst, responses);
    return {
      templateId: inst.templateId,
      seed: inst.seed,
      family: meta.family,
      spec: meta.spec,
      chapter: meta.chapter,
      difficulty: meta.difficulty,
      mode: set.kind === 'mock' ? 'mock' : 'timed',
      setId: set.id,
      startedAt: set.startedAt ?? Date.now(),
      finishedAt: set.finishedAt ?? Date.now(),
      durationMs: Math.round((totalMs * meta.marks) / marksAll),
      marks: meta.marks,
      parts: inst.parts.map((p, k) => partAttemptFrom(p.label, results[k], responses[p.label] ?? null, undefined, p.scheme, 0)),
      gaveUp: false,
    } satisfies Attempt;
  });
}
