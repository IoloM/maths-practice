import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import type { Attempt, CardRecord } from '../storage/types';
import { onProgressChange } from '../progress/record';

/** All attempts and cards, refreshed whenever progress changes. */
export function useProgress(): { attempts: Attempt[]; cards: CardRecord[]; loading: boolean } {
  const [state, setState] = useState<{ attempts: Attempt[]; cards: CardRecord[]; loading: boolean }>({ attempts: [], cards: [], loading: true });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const store = await getStore();
      const [attempts, cards] = await Promise.all([store.allAttempts(), store.allCards()]);
      if (alive) setState({ attempts, cards, loading: false });
    };
    void load();
    const off = onProgressChange(() => void load());
    return () => {
      alive = false;
      off();
    };
  }, []);
  return state;
}
