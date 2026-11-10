/**
 * Question sets: mock papers, timed sets and the daily set.
 * Building is deterministic given a random function, so sets can be reproduced and shared.
 */
import { BANK, type BankEntry } from '../content/bank-meta';
import { seedsFor } from '../content/bank-seeds';
import { CHAPTER_BY_REF } from '../content/chapters';
import type { Attempt, CardRecord, SetItem, SetRecord } from '../storage/types';
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
  /** A level (9MA0) or AS (8MA0) */
  course: 'alevel' | 'as';
  sections: PaperSection[];
  /** time allowed per mark when it isn't 1.2 (AS Paper 2: 75 minutes for 60 marks) */
  minutesPerMark?: number;
}

const stream = (e: BankEntry) => CHAPTER_BY_REF.get(e.chapter)?.stream;
const isPure = (e: BankEntry) => stream(e) === 'Pure';
const isStats = (e: BankEntry) => stream(e) === 'Statistics';
const isMech = (e: BankEntry) => stream(e) === 'Mechanics';
const isAS = (e: BankEntry) => e.level === 'AS';

export const PAPERS: PaperSpec[] = [
  { id: 'p1', course: 'alevel', title: 'Paper 1: Pure Mathematics 1', sections: [{ name: 'Pure Mathematics', marks: 100, filter: (e) => isPure(e) && e.paper.includes(1) }] },
  { id: 'p2', course: 'alevel', title: 'Paper 2: Pure Mathematics 2', sections: [{ name: 'Pure Mathematics', marks: 100, filter: (e) => isPure(e) && e.paper.includes(2) }] },
  {
    id: 'p3',
    course: 'alevel',
    title: 'Paper 3: Statistics and Mechanics',
    sections: [
      { name: 'Section A: Statistics', marks: 50, filter: isStats },
      { name: 'Section B: Mechanics', marks: 50, filter: isMech },
    ],
  },
  { id: 'p1-half', course: 'alevel', title: 'Half paper: Pure (50 marks)', sections: [{ name: 'Pure Mathematics', marks: 50, filter: isPure }] },
  { id: 'p3-stats', course: 'alevel', title: 'Section practice: Statistics (50 marks)', sections: [{ name: 'Statistics', marks: 50, filter: isStats }] },
  { id: 'p3-mech', course: 'alevel', title: 'Section practice: Mechanics (50 marks)', sections: [{ name: 'Mechanics', marks: 50, filter: isMech }] },
  // AS (8MA0): Year 1 content only
  { id: 'as1', course: 'as', title: 'AS Paper 1: Pure Mathematics', sections: [{ name: 'Pure Mathematics', marks: 100, filter: (e) => isPure(e) && isAS(e) }] },
  {
    id: 'as2',
    course: 'as',
    title: 'AS Paper 2: Statistics and Mechanics',
    minutesPerMark: 1.25,
    sections: [
      { name: 'Section A: Statistics', marks: 30, filter: (e) => isStats(e) && isAS(e) },
      { name: 'Section B: Mechanics', marks: 30, filter: (e) => isMech(e) && isAS(e) },
    ],
  },
  { id: 'as1-half', course: 'as', title: 'AS half paper: Pure (50 marks)', sections: [{ name: 'Pure Mathematics', marks: 50, filter: (e) => isPure(e) && isAS(e) }] },
];

/** Minutes allowed for a paper of `marks` marks. */
export const paperMinutes = (p: PaperSpec, marks: number) => Math.round(marks * (p.minutesPerMark ?? MINUTES_PER_MARK));

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

/** Real papers: about 40% of the marks are on questions worth 8 marks or more. */
export const LONG_MARKS = 8;
export const LONG_SHARE = 0.4;

/**
 * Choose templates totalling exactly `target` marks where possible: long questions first (up to
 * `longShare` of the marks, as on real papers), then one per family, spread across chapters, then
 * fill any gap; ordered easier → harder like an exam paper.
 */
export function fillToMarks(pool: BankEntry[], target: number, rnd: () => number, maxFixedShare = 0.15, longShare = LONG_SHARE): BankEntry[] {
  const shuffled = shuffle(pool, rnd);
  const chosen: BankEntry[] = [];
  const families = new Set<string>();
  const perChapter = new Map<string, number>();
  const maxPerChapter = Math.max(1, Math.round(target / 22));
  let total = 0,
    fixedMarks = 0,
    longMarks = 0;
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
    if (e.marks >= LONG_MARKS) longMarks += e.marks;
  };
  // long exam-style questions, up to their share of the paper (leaving room for the rest)
  const longTarget = target * longShare;
  for (const e of shuffled) {
    if (total >= longTarget) break;
    if (e.marks >= LONG_MARKS && total + e.marks <= longTarget + LONG_MARKS / 2 && canAdd(e, true)) add(e);
  }
  for (const e of shuffled) {
    if (total >= target - 2) break;
    // no more long questions once they have their share
    if (canAdd(e, true) && (e.marks < LONG_MARKS || longMarks < longTarget)) add(e);
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

const pickSeed = (e: BankEntry, rnd: () => number) => {
  const seeds = seedsFor(e.id);
  return seeds[Math.floor(rnd() * seeds.length)];
};

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

export { todayKey } from './dates';
const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Today's set (5 questions, about 20–25 marks): due reviews first, then the weakest chapters you
 * have practised, then new chapters (Year 1 only for AS). Deterministic for the day and the progress so far.
 */
export function buildDaily(day: string, attempts: Attempt[], cards: CardRecord[], size = 5, onlyAS = false): SetItem[] {
  const rnd = rng(hashString(`daily:${day}`));
  const gen = BANK.templates.filter((e) => !e.fixed && (!onlyAS || e.level === 'AS'));
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
