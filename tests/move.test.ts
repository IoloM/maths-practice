// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { openIdbStore } from '../src/storage/idb';
import { pack, unpack } from '../src/lib/move';
import type { Attempt } from '../src/storage/types';

const attempt = (templateId: string, finishedAt: number): Attempt => ({ templateId, seed: 1, family: 'f', spec: [], chapter: 'P1.1', difficulty: 1, mode: 'practice', startedAt: finishedAt - 1000, finishedAt, durationMs: 1000, marks: 2, parts: [], gaveUp: false });

describe('moving to the new address', () => {
  it('packs every database and setting, and merges them in without overwriting what is already there', async () => {
    const a = await openIdbStore('maths-practice');
    await a.addAttempt(attempt('p1.1.a', 1000));
    await a.putSetting('topicMarks', { 'P1.2': { flag: 'help', updatedAt: 5 } });
    a.close();
    const b = await openIdbStore('maths-practice-c-abc');
    await b.addAttempt(attempt('p1.1.b', 2000));
    b.close();
    const other = await openIdbStore('someone-else');
    other.close();
    localStorage.setItem('mp.settings.v1', '{"theme":"dark"}');
    localStorage.setItem('mp.cloud.me', '{"id":"abc"}');
    localStorage.setItem('not-ours', 'x');

    const parcel = await pack();
    expect(Object.keys(parcel.dbs).sort()).toEqual(['maths-practice', 'maths-practice-c-abc']);
    expect(Object.keys(parcel.local).sort()).toEqual(['mp.cloud.me', 'mp.settings.v1']);

    // a fresh address (simulated by clearing), where one setting was already chosen
    for (const name of ['maths-practice', 'maths-practice-c-abc']) await new Promise((r) => (indexedDB.deleteDatabase(name).onsuccess = r));
    localStorage.clear();
    localStorage.setItem('mp.settings.v1', '{"theme":"light"}');

    const n = await unpack({ ...parcel, dbs: { ...parcel.dbs, 'evil-db': parcel.dbs['maths-practice'] } });
    expect(n).toBe(2);
    const a2 = await openIdbStore('maths-practice');
    expect((await a2.allAttempts()).map((x) => x.templateId)).toEqual(['p1.1.a']);
    expect(await a2.getSetting('topicMarks', null)).toEqual({ 'P1.2': { flag: 'help', updatedAt: 5 } });
    a2.close();
    const b2 = await openIdbStore('maths-practice-c-abc');
    expect((await b2.allAttempts()).map((x) => x.templateId)).toEqual(['p1.1.b']);
    b2.close();
    expect(localStorage.getItem('mp.settings.v1')).toBe('{"theme":"light"}');
    expect(localStorage.getItem('mp.cloud.me')).toBe('{"id":"abc"}');
    const names = (await indexedDB.databases()).map((d) => d.name);
    expect(names).not.toContain('evil-db');
  });
});
