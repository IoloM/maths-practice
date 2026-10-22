import { useEffect, useRef } from 'react';
import { codeMarks, selfAwardable } from '../engine/marking/mark';
import type { MarkResult, SchemeLine } from '../engine/marking/types';
import type { PartAttempt } from '../storage/types';

/** Milliseconds the page has been visible since mount (pauses when hidden). */
export function useActiveTime(): () => number {
  const acc = useRef(0);
  const since = useRef<number | null>(typeof document !== 'undefined' && document.visibilityState === 'visible' ? performance.now() : null);
  useEffect(() => {
    const on = () => {
      if (document.visibilityState === 'visible') since.current = performance.now();
      else if (since.current !== null) {
        acc.current += performance.now() - since.current;
        since.current = null;
      }
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return () => acc.current + (since.current !== null ? performance.now() - since.current : 0);
}

/** Marks from ticked scheme lines (only self-awardable lines count). */
export function selfScore(scheme: SchemeLine[], ticks: boolean[]): number {
  const ok = selfAwardable(scheme);
  return scheme.reduce((s, l, i) => s + (ticks[i] && ok[i] ? codeMarks(l.code) : 0), 0);
}

export { effectiveScore } from './score';

export function partAttemptFrom(label: string, result: MarkResult | undefined, response: PartAttempt['response'], ticks: boolean[] | undefined, scheme: SchemeLine[], hints: number): PartAttempt {
  const self = ticks && ticks.some(Boolean) ? { score: selfScore(scheme, ticks), ticks: ticks.map((t, i) => (t ? i : -1)).filter((i) => i >= 0) } : null;
  return {
    label,
    response: response ?? null,
    auto: result ? { score: result.score, max: result.max, verdict: result.verdict, errorId: result.errorId, ft: result.ft } : null,
    self,
    hints,
  };
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60} s` : `${s} s`;
}
