import { describe, expect, it } from 'vitest';
import { GENS, SPEED_AREAS, SPEED_COUNT, speedCorrect, speedRound } from '../src/lib/speed';
import { isBest } from '../src/lib/speed-records';
import { withRetries } from '../src/engine/core/rng';
import { answerTex, canonicalResponse } from '../src/engine/marking/mark';
import { katexError, mathSegments } from '../src/engine/templates/validate';

describe('speed rounds', () => {
  it('every kind of question marks its own answer right and a wrong one wrong, and its maths renders', () => {
    for (const g of GENS) {
      for (let seed = 1; seed <= 60; seed++) {
        const q = { kind: g.kind, ...withRetries(`test:${g.kind}:${seed}`, g.make) };
        const where = `${g.kind} #${seed}: ${q.prompt}`;
        expect(speedCorrect(q, canonicalResponse(q.answer)), where).toBe(true);
        expect(speedCorrect(q, '123456789'), where).toBe(false);
        for (const t of [q.prompt, q.how]) for (const m of mathSegments(t)) expect(katexError(m), `${where}: ${m}`).toBeNull();
        expect(katexError(answerTex(q.answer)), where).toBeNull();
      }
    }
  });
  it('every area has enough kinds of question for a round of different ones', () => {
    for (const area of ['pure', 'stats', 'mech'] as const) expect(GENS.filter((g) => g.area === area).length, area).toBeGreaterThanOrEqual(SPEED_COUNT);
  });
  it('a round is 10 different kinds of question, the same every time for the same seed', () => {
    for (const { id } of SPEED_AREAS) {
      const a = speedRound(id, 42);
      expect(a).toHaveLength(SPEED_COUNT);
      expect(new Set(a.map((q) => q.kind)).size).toBe(SPEED_COUNT);
      expect(speedRound(id, 42).map((q) => q.prompt)).toEqual(a.map((q) => q.prompt));
      expect(speedRound(id, 43).map((q) => q.prompt)).not.toEqual(a.map((q) => q.prompt));
    }
  });
  it('a personal best is a higher score, or the same score quicker', () => {
    const rec = { best: 7, bestSeconds: 200, rounds: 3, recent: [], updatedAt: 0 };
    expect(isBest(5, 100, undefined)).toBe(true);
    expect(isBest(8, 290, rec)).toBe(true);
    expect(isBest(7, 150, rec)).toBe(true);
    expect(isBest(7, 200, rec)).toBe(false);
    expect(isBest(6, 60, rec)).toBe(false);
  });
});
