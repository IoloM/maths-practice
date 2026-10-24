/**
 * Preferences (localStorage, one set per login on the device). Progress lives in IndexedDB.
 * The SYNCED_PREFS follow a signed-in person to their other devices; the rest belong to the device.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Paper } from '../storage/types';
import type { ExamDates } from './exams';
import { settingsKey } from './logins';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  input: 'maths' | 'plain';
  paper: Paper;
  pencilOnly: boolean;
  workingMode: 'write' | 'type';
  showWorking: boolean;
  installDismissed: number;
  persistAsked: boolean;
  /** the student's exam dates (YYYY-MM-DD), for the countdown */
  examDates: ExamDates;
  /** questions a day to aim for */
  dailyGoal: number;
  /** when a preference that follows the person (SYNCED_PREFS) last changed (ms) */
  prefsAt: number;
}

/** Preferences that follow a person between devices; the rest belong to the device. */
export const SYNCED_PREFS = ['theme', 'input', 'paper', 'pencilOnly', 'workingMode', 'showWorking', 'examDates', 'dailyGoal'] as const;
export type SyncedPrefs = Pick<Settings, (typeof SYNCED_PREFS)[number]>;

const DEFAULTS: Settings = {
  theme: 'system',
  input: 'maths',
  paper: 'squared',
  pencilOnly: false,
  workingMode: 'write',
  showWorking: true,
  installDismissed: 0,
  persistAsked: false,
  examDates: {},
  dailyGoal: 5,
  prefsAt: 0,
};
/** each login on the device has its own settings */
const KEY = settingsKey();

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
let current: Settings | null = null;
/** The current settings (also read outside React, e.g. by sync). */
export const readSettings = (): Settings => (current ??= load());
const listeners = new Set<(s: Settings) => void>();
const watchers = new Set<(s: Settings, old: Settings) => void>();
/** Called after any settings change (outside React). */
export function onSettingsChange(f: (s: Settings, old: Settings) => void): () => void {
  watchers.add(f);
  return () => watchers.delete(f);
}

function save(p: Partial<Settings>): Settings {
  const old = readSettings();
  const n: Settings = { ...old, ...p };
  if (p.prefsAt === undefined && SYNCED_PREFS.some((k) => k in p && JSON.stringify(p[k]) !== JSON.stringify(old[k]))) n.prefsAt = Date.now();
  current = n;
  try {
    localStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f(n));
  watchers.forEach((f) => f(n, old));
  return n;
}

export const syncedPrefs = (s: Settings = readSettings()): SyncedPrefs => Object.fromEntries(SYNCED_PREFS.map((k) => [k, s[k]])) as SyncedPrefs;

/** Take preferences changed on another device (only known keys of the right kind, only if newer). */
export function applySyncedPrefs(values: Partial<SyncedPrefs>, at: number): boolean {
  if (!(at > readSettings().prefsAt)) return false;
  const p: Partial<Settings> = {};
  for (const k of SYNCED_PREFS) if (k in values && typeof values[k] === typeof DEFAULTS[k]) (p as Record<string, unknown>)[k] = values[k];
  save({ ...p, prefsAt: at });
  return true;
}

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void }>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readSettings);
  useEffect(() => {
    listeners.add(setSettings);
    return () => void listeners.delete(setSettings);
  }, []);
  const update = useCallback((p: Partial<Settings>) => void save(p), []);
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);
  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
