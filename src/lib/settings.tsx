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

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => void }>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  const update = useCallback((p: Partial<Settings>) => {
    setSettings((s) => {
      const n = { ...s, ...p };
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* private mode */
      }
      return n;
    });
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
