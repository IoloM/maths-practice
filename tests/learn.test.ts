import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content/chapters';
import { VIDEOS } from '../src/content/videos';
import { loadNotes } from '../src/content/notes';
import { katexError, mathSegments } from '../src/engine/templates/validate';
import { cleanUrl, flagged, youTubeId } from '../src/lib/topics';
import { buildPlan } from '../src/lib/plan';

describe('learn: notes and videos for every topic', () => {
  it('every chapter has notes, and every bit of maths in them renders', async () => {
    for (const c of CHAPTERS) {
      const n = await loadNotes(c.ref);
      expect(n, c.ref).toBeTruthy();
      expect(n!.key.length, c.ref).toBeGreaterThanOrEqual(3);
      expect(n!.example.steps.length, c.ref).toBeGreaterThanOrEqual(2);
      const text = [n!.intro, ...n!.key, ...(n!.formulae ?? []).flat(), n!.example.q, ...n!.example.steps, ...n!.mistakes, ...n!.tips];
      for (const t of text) for (const m of mathSegments(t)) expect(katexError(m), `${c.ref}: ${m}`).toBeNull();
    }
  });
  it('every chapter has at least one video, each a proper YouTube id', () => {
    for (const c of CHAPTERS) {
      const v = VIDEOS[c.ref] ?? [];
      expect(v.length, c.ref).toBeGreaterThan(0);
      for (const x of v) expect(x.id, c.ref).toMatch(/^[\w-]{11}$/);
    }
    const ids = Object.values(VIDEOS).flat().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('your links', () => {
  it('reads YouTube links in their usual forms', () => {
    for (const u of ['https://www.youtube.com/watch?v=ueWWMLrR4Ow', 'https://youtu.be/ueWWMLrR4Ow', 'https://m.youtube.com/watch?v=ueWWMLrR4Ow&t=30', 'https://www.youtube.com/shorts/ueWWMLrR4Ow', 'https://www.youtube-nocookie.com/embed/ueWWMLrR4Ow'])
      expect(youTubeId(u), u).toBe('ueWWMLrR4Ow');
    expect(youTubeId('https://example.com/watch?v=ueWWMLrR4Ow')).toBeNull();
  });
  it('only keeps https links', () => {
    expect(cleanUrl(' https://mathsgenie.co.uk/a-level.html ')).toBe('https://mathsgenie.co.uk/a-level.html');
    expect(cleanUrl('javascript:alert(1)')).toBeNull();
    expect(cleanUrl('http://insecure.example')).toBeNull();
    expect(cleanUrl('not a link')).toBeNull();
  });
});

describe('marked topics', () => {
  it('newest first, by kind', () => {
    const marks = { 'P1.2': { flag: 'help' as const, since: 1, updatedAt: 1 }, 'P1.13': { flag: 'help' as const, since: 5, updatedAt: 5 }, 'SM1.6': { flag: 'learn' as const, since: 3, updatedAt: 3 }, 'P2.1': { flag: null, updatedAt: 9 } };
    expect(flagged(marks, 'help')).toEqual(['P1.13', 'P1.2']);
    expect(flagged(marks)).toEqual(['P1.13', 'SM1.6', 'P1.2']);
  });
  it('today’s plan starts with learning a topic you asked for help with', () => {
    const plan = buildPlan({ attempts: [], cards: [], papers: {}, notes: {}, setWork: [], exams: [], topics: { 'P2.11': { flag: 'help', since: 1, updatedAt: 1 } } });
    expect(plan[0]).toMatchObject({ id: 'learn-P2.11', title: 'Learn Integration', path: '/learn/P2.11', done: false });
  });
});
