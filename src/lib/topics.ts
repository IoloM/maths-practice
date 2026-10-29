/**
 * Topics you've marked to learn or that you need help with, with your own notes and links for
 * each. Kept in the settings store (backups include it) and synced with your account, a topic at a
 * time, newest change winning.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import { notifyProgress, onProgressChange } from '../progress/record';

export type TopicFlag = 'help' | 'learn';
export const FLAGS: { id: TopicFlag; label: string; short: string }[] = [
  { id: 'help', label: 'I need help with this', short: 'Need help' },
  { id: 'learn', label: 'I want to learn this', short: 'Want to learn' },
];

export interface TopicLink {
  url: string;
  title: string;
}
export interface TopicMark {
  flag: TopicFlag | null;
  /** your own notes for the topic */
  note?: string;
  /** videos and pages you've added */
  links?: TopicLink[];
  /** when you marked it */
  since?: number;
  /** when you said you'd learnt it: check-ins follow */
  learnt?: number;
  /** check-ins done since then */
  checks?: TopicCheck[];
  /** how confident you feel: 1 not yet, 2 getting there, 3 confident */
  confidence?: 1 | 2 | 3;
  /** videos you've watched (YouTube ids) */
  watched?: string[];
  updatedAt: number;
}
export interface TopicCheck {
  at: number;
  got: number;
  of: number;
  /** the set it came from (so it's only counted once) */
  set: string;
}
/** chapter ref → mark */
export type TopicMarks = Record<string, TopicMark>;
export const TOPICS_KEY = 'topicMarks';

export async function loadTopicMarks(): Promise<TopicMarks> {
  return (await getStore()).getSetting<TopicMarks>(TOPICS_KEY, {});
}

async function update(chapter: string, f: (m: TopicMark) => Omit<TopicMark, 'updatedAt'>): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<TopicMarks>(TOPICS_KEY, {})) };
  all[chapter] = { ...f(all[chapter] ?? { flag: null, updatedAt: 0 }), updatedAt: Date.now() };
  await store.putSetting(TOPICS_KEY, all);
  notifyProgress();
}

export const setConfidence = (chapter: string, confidence: 1 | 2 | 3 | undefined) => update(chapter, (m) => ({ ...m, confidence }));
/** Tick a video watched (or not). */
export const setWatched = (chapter: string, id: string, on: boolean) =>
  update(chapter, (m) => {
    const rest = (m.watched ?? []).filter((x) => x !== id);
    return { ...m, watched: on ? [...rest, id].slice(-300) : rest };
  });

// ---------------------------------------------------------------- check-ins after learning a topic
/** Days between check-ins: 3, then 4 more (7), then 14 more (21). */
export const CHECK_GAPS = [3, 4, 14];
const DAY = 86_400_000;

/** You've learnt it: unmark it and start the check-ins. */
export const markLearnt = (chapter: string) => update(chapter, (m) => ({ ...m, flag: null, since: undefined, learnt: Date.now(), checks: [] }));

/** When the next check-in is due, or null when there are none left (or it isn't learnt). */
export function nextCheck(m: TopicMark | undefined): number | null {
  if (!m?.learnt || m.flag) return null;
  const done = m.checks ?? [];
  if (done.length >= CHECK_GAPS.length) return null;
  return (done.length ? done[done.length - 1].at : m.learnt) + CHECK_GAPS[done.length] * DAY;
}

/** Topics with a check-in due now, longest-waiting first. */
export function dueChecks(marks: TopicMarks, now = Date.now()): string[] {
  return Object.entries(marks)
    .map(([c, m]) => [c, nextCheck(m)] as const)
    .filter(([, t]) => t !== null && t <= now)
    .sort((a, b) => a[1]! - b[1]!)
    .map(([c]) => c);
}

/** Record a finished check-in (once per set; self-marking afterwards updates its score). */
export const recordCheck = (chapter: string, check: TopicCheck) =>
  update(chapter, (m) => {
    const had = m.checks?.some((c) => c.set === check.set);
    return { ...m, checks: had ? m.checks!.map((c) => (c.set === check.set ? { ...c, got: check.got, of: check.of } : c)) : [...(m.checks ?? []), check] };
  });

export const setFlag = (chapter: string, flag: TopicFlag | null) => update(chapter, (m) => ({ ...m, flag, since: flag ? (m.flag ? m.since : Date.now()) : undefined }));
export const setTopicNote = (chapter: string, note: string) => update(chapter, (m) => ({ ...m, note: note.slice(0, 5000) || undefined }));

/** Only web addresses (https), so a link can never run anything. */
export function cleanUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}
export const addLink = (chapter: string, link: TopicLink) =>
  update(chapter, (m) => ({ ...m, links: [...(m.links ?? []).filter((l) => l.url !== link.url), { url: link.url, title: link.title.slice(0, 120) || link.url }].slice(-20) }));
export const removeLink = (chapter: string, url: string) => update(chapter, (m) => ({ ...m, links: (m.links ?? []).filter((l) => l.url !== url) }));

/** A YouTube video id from any of its usual link forms, or null. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    const id = host === 'youtu.be' ? u.pathname.slice(1) : host === 'youtube.com' || host === 'youtube-nocookie.com' ? (u.searchParams.get('v') ?? /^\/(?:embed|shorts|live)\/([^/?]+)/.exec(u.pathname)?.[1] ?? '') : '';
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Your marks, kept up to date. */
export function useTopicMarks(): TopicMarks | null {
  const [marks, setMarks] = useState<TopicMarks | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadTopicMarks().then((m) => alive && setMarks(m));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return marks;
}

export const flagged = (marks: TopicMarks, flag?: TopicFlag) =>
  Object.entries(marks)
    .filter(([, m]) => (flag ? m.flag === flag : m.flag))
    .sort((a, b) => (b[1].since ?? 0) - (a[1].since ?? 0))
    .map(([chapter]) => chapter);
