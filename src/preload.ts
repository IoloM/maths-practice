/**
 * Start fetching the chunks the first screen needs in parallel with the first render, instead of
 * discovering them one wave at a time (page → question view → chapter of questions).
 */
import { ENTRY_BY_ID } from './content/bank-meta';
import { loaders } from './content/templates/loaders.gen';

const PAGES: Record<string, () => Promise<unknown>> = {
  q: () => import('./pages/QuestionPage'),
  practice: () => import('./pages/Practice'),
  review: () => import('./pages/Review'),
  set: () => import('./pages/SetRunner'),
  exams: () => import('./pages/Exams'),
  progress: () => import('./pages/Progress'),
  reference: () => import('./pages/Reference'),
  flashcards: () => import('./pages/Flashcards'),
  'past-papers': () => import('./pages/PastPapers'),
  settings: () => import('./pages/Settings'),
  account: () => import('./pages/Account'),
  admin: () => import('./pages/Admin'),
};

export function preloadForHash(hash: string): void {
  const [first, second] = hash.replace(/^#\/?/, '').split('?')[0].split('/');
  void PAGES[first]?.();
  if (['q', 'practice', 'review', 'set'].includes(first)) void import('./components/QuestionView');
  if (first === 'q' && second) {
    const e = ENTRY_BY_ID.get(decodeURIComponent(second));
    if (e?.fixed) void import('./content/fixed/templates');
    else if (e && loaders[e.chapter]) void loaders[e.chapter]();
  }
}
