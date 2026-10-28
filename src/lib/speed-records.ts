/**
 * Speed-round personal bests: your best score for each kind of round, kept in the settings store
 * and synced with your account (newest change to each kind winning). Kept apart from the question
 * generators so the home page can show your best without loading them.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import { notifyProgress, onProgressChange } from '../progress/record';

export type SpeedArea = 'pure' | 'stats' | 'mech' | 'mixed';

export interface SpeedRun {
  at: number;
  got: number;
  seconds: number;
}
export interface SpeedRecord {
  best: number;
  /** time taken for the best score (quicker breaks a tie) */
  bestSeconds: number;
  rounds: number;
  /** the latest few rounds, newest last */
  recent: SpeedRun[];
  updatedAt: number;
}
/** area → record */
export type SpeedRecords = Record<string, SpeedRecord>;
export const SPEED_KEY = 'speedRounds';

export const isBest = (got: number, seconds: number, rec: SpeedRecord | undefined) => !rec || got > rec.best || (got === rec.best && seconds < rec.bestSeconds);

export async function loadSpeed(): Promise<SpeedRecords> {
  return (await getStore()).getSetting<SpeedRecords>(SPEED_KEY, {});
}

/** Save a finished round; says whether it's a new personal best. */
export async function recordSpeed(area: SpeedArea, run: SpeedRun): Promise<boolean> {
  const store = await getStore();
  const all = { ...(await store.getSetting<SpeedRecords>(SPEED_KEY, {})) };
  const rec = all[area];
  const best = isBest(run.got, run.seconds, rec);
  all[area] = {
    best: best ? run.got : rec!.best,
    bestSeconds: best ? run.seconds : rec!.bestSeconds,
    rounds: (rec?.rounds ?? 0) + 1,
    recent: [...(rec?.recent ?? []), run].slice(-10),
    updatedAt: Date.now(),
  };
  await store.putSetting(SPEED_KEY, all);
  notifyProgress();
  return best;
}

export function useSpeed(): SpeedRecords | null {
  const [recs, setRecs] = useState<SpeedRecords | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadSpeed().then((s) => alive && setRecs(s));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return recs;
}
