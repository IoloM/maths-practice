/** Per-device UI preferences (localStorage). Progress lives in IndexedDB. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Paper } from '../storage/types';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  input: 'maths' | 'plain';
  paper: Paper;
  pencilOnly: boolean;
  workingMode: 'write' | 'type';
  showWorking: boolean;
  installDismissed: number;
  persistAsked: boolean;
  /** sync / AI server address; empty uses the one built into the app (if any) */
  apiUrl: string;
  /** access code for AI reading and marking */
  aiCode: string;
  /** this device's sync code (empty: not syncing) */
  syncCode: string;
}

const DEFAULTS: Settings = {
  theme: 'system',
  input: 'maths',
  paper: 'squared',
  pencilOnly: false,
  workingMode: 'write',
  showWorking: true,
  installDismissed: 0,
  persistAsked: false,
  apiUrl: '',
  aiCode: '',
  syncCode: '',
};
const KEY = 'mp.settings.v1';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
let current: Settings | null = null;
/** The current settings (also read outside React, e.g. by background sync). */
export const readSettings = (): Settings => (current ??= load());

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void }>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readSettings);
  const update = useCallback((p: Partial<Settings>) => {
    const n = (current = { ...readSettings(), ...p });
    try {
      localStorage.setItem(KEY, JSON.stringify(n));
    } catch {
      /* private mode */
    }
    setSettings(n);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);
  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
