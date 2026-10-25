import { describe, expect, it } from 'vitest';
import { cellValue, fromSheets, relation, sample, summary, values } from '../src/lib/lds';

const sheet = (name: string, rows: unknown[][]) => ({ name, rows });
const camborne = sheet('Camborne May-Oct 2015', [
  ['Camborne', null, null, null],
  [null, null, null, null],
  ['Date', 'Daily Mean Temperature (0900-0900) (°C)', 'Daily Total Rainfall (0900-0900) (mm)', 'Cardinal Wind Direction'],
  [new Date(2015, 4, 1), 10.5, 'tr', 'NE'],
  [new Date(2015, 4, 2), 11, 2.4, 'N'],
  [new Date(2015, 4, 3), 'n/a', 0, 'SW'],
  [new Date(2015, 4, 4), 12.5, 'n/a', 'S'],
  [new Date(2015, 4, 5), 14, 5, 'S'],
]);

describe('the large data set', () => {
  it('reads values the way the data set writes them', () => {
    expect([cellValue(3.5), cellValue('tr'), cellValue(' n/a '), cellValue(''), cellValue('4.2'), cellValue('NE')]).toEqual([3.5, 'tr', null, null, 4.2, null]);
  });
  it('finds the station, the year, the dates and the number columns (not compass points)', () => {
    const d = fromSheets('lds.xls', [sheet('Notes', [['About this data']]), camborne])!;
    expect(d.sheets).toHaveLength(1);
    expect(d.sheets[0]).toMatchObject({ station: 'Camborne', year: 2015 });
    expect(d.sheets[0].dates[0]).toBe('2015-05-01');
    expect(d.variables).toEqual(['Daily Mean Temperature (0900-0900) (°C)', 'Daily Total Rainfall (0900-0900) (mm)']);
  });
  it('leaves out n/a, and counts tr as 0 unless told not to', () => {
    const s = fromSheets('x', [camborne])!.sheets;
    expect(values(s, 'Daily Total Rainfall (0900-0900) (mm)')).toEqual({ xs: [0, 2.4, 0, 5], missing: 1, trace: 1 });
    expect(values(s, 'Daily Total Rainfall (0900-0900) (mm)', false).xs).toEqual([2.4, 0, 5]);
  });
  it('quartiles the Edexcel way for discrete data', () => {
    const s = summary([1, 2, 3, 4, 5, 6, 7, 8])!;
    expect([s.q1, s.median, s.q3]).toEqual([2.5, 4.5, 6.5]);
    const t = summary([1, 2, 3, 4, 5, 6, 7, 8, 9, 40])!;
    expect([t.q1, t.median, t.q3, t.outliers]).toEqual([3, 5.5, 8, [40]]);
    expect(t.sd).toBeCloseTo(10.78, 2);
  });
  it('PMCC and regression line from days with both values', () => {
    const s = fromSheets('x', [camborne])!.sheets;
    const r = relation(s, 'Daily Mean Temperature (0900-0900) (°C)', 'Daily Total Rainfall (0900-0900) (mm)')!;
    expect(r.pts).toEqual([
      [10.5, 0],
      [11, 2.4],
      [14, 5],
    ]);
    expect(r.r).toBeGreaterThan(0.9);
  });
  it('samples: random without repeats; systematic every n/k-th day', () => {
    const r = sample(184, 20, 'random', 7);
    expect(new Set(r).size).toBe(20);
    expect(sample(184, 20, 'random', 7)).toEqual(r);
    const sys = sample(184, 23, 'systematic', 3);
    expect(sys.slice(1).map((x, i) => x - sys[i])).toEqual(Array(22).fill(8));
  });
});
