import { describe, expect, it } from 'vitest';
import { savedKey, savedList, type SavedQuestions } from '../src/lib/saved';

describe('saved for later', () => {
  it('lists saved questions newest first, leaving out ones taken off', () => {
    const all: SavedQuestions = {
      [savedKey('a', 1)]: { templateId: 'a', seed: 1, savedAt: 10, updatedAt: 10 },
      [savedKey('b', 2)]: { templateId: 'b', seed: 2, savedAt: 30, updatedAt: 30 },
      [savedKey('c', 3)]: { templateId: 'c', seed: 3, savedAt: 20, updatedAt: 40, removed: true },
    };
    expect(savedList(all).map((q) => q.templateId)).toEqual(['b', 'a']);
    expect(savedKey('p1.13.x', 4)).toBe('p1.13.x:4');
  });
});
