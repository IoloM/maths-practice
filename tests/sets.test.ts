/** Mock papers, timed sets, daily sets, share codes and exam marking. */
import { describe, expect, it } from 'vitest';
import { BANK, ENTRY_BY_ID } from '../src/content/bank';
import { CHAPTER_BY_REF } from '../src/content/chapters';
import { PAPERS, buildDaily, buildPaper, buildTimed, decodeSet, encodeSet, markInstance, setMarks } from '../src/lib/sets';
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';
import { generateInstance } from '../src/engine/templates/validate';
import { canonicalResponse } from '../src/engine/marking/mark';

const streamOf = (id: string) => CHAPTER_BY_REF.get(ENTRY_BY_ID.get(id)!.chapter)!.stream;

describe('mock papers', () => {
  for (const p of PAPERS) {
    it(`${p.title} hits its mark total with suitable questions`, () => {
      for (const seed of [1, 2, 3, 42, 999]) {
        const { items, sections, marks } = buildPaper(p, seed);
        const want = p.sections.reduce((s, x) => s + x.marks, 0);
        expect(marks).toBeLessThanOrEqual(want);
        expect(marks).toBeGreaterThanOrEqual(want - 2);
        expect(new Set(items.map((i) => i.templateId)).size).toBe(items.length);
        sections.forEach((sec, k) => {
          for (const it of items.slice(sec.from, sec.to)) expect(p.sections[k].filter(ENTRY_BY_ID.get(it.templateId)!)).toBe(true);
        });
        for (const it of items) expect(ENTRY_BY_ID.get(it.templateId)!.seeds).toContain(it.seed);
      }
    });
  }
  it('paper 3 has a statistics section then a mechanics section', () => {
    const { items, sections } = buildPaper(PAPERS.find((p) => p.id === 'p3')!, 7);
    for (const it of items.slice(sections[0].from, sections[0].to)) expect(streamOf(it.templateId)).toBe('Statistics');
    for (const it of items.slice(sections[1].from, sections[1].to)) expect(streamOf(it.templateId)).toBe('Mechanics');
  });
  it('is reproducible from its seed', () => {
    expect(buildPaper(PAPERS[0], 5)).toEqual(buildPaper(PAPERS[0], 5));
  });
});

describe('timed and daily sets', () => {
  it('timed set from one chapter reaches the target marks', () => {
    const pool = BANK.templates.filter((e) => e.chapter === 'P1.13');
    const items = buildTimed(pool, 20, 3);
    expect(setMarks(items)).toBeGreaterThanOrEqual(18);
    expect(setMarks(items)).toBeLessThanOrEqual(20);
  });
  it('daily set has five different families and is stable for a day', () => {
    const a = buildDaily('2026-10-20', [], []);
    expect(a).toHaveLength(5);
    expect(new Set(a.map((i) => ENTRY_BY_ID.get(i.templateId)!.family)).size).toBe(5);
    expect(buildDaily('2026-10-20', [], [])).toEqual(a);
    expect(buildDaily('2026-10-21', [], [])).not.toEqual(a);
  });
});

describe('share codes', () => {
  it('round-trip', () => {
    const s = { kind: 'timed' as const, durationMin: 24, title: 'Integration — 20 marks', items: [{ templateId: 'p1.13.definite-polynomial', seed: 4 }, { templateId: 'fx.lds.period', seed: 0 }] };
    expect(decodeSet(encodeSet(s))).toEqual(s);
    expect(decodeSet('nonsense')).toBeNull();
  });
});

describe('exam marking', () => {
  it('canonical responses score full marks through follow-through chains', () => {
    for (const t of ALL_TEMPLATES.slice(0, 120)) {
      const inst = generateInstance(t, ENTRY_BY_ID.get(t.id)!.seeds[0]);
      const responses = Object.fromEntries(inst.parts.map((p) => [p.label, p.answer.type === 'self' ? undefined : canonicalResponse(p.answer)]));
      const results = markInstance(inst, responses);
      results.forEach((r, k) => {
        if (inst.parts[k].answer.type !== 'self') expect(r.score, `${t.id} part ${inst.parts[k].label}`).toBe(inst.parts[k].marks);
      });
    }
  });
});
