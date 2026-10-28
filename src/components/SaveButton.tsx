import { savedKey, setSaved, useSaved } from '../lib/saved';
import { Icon } from './Icon';

/** Save a question to come back to (press again to take it off the list). */
export function SaveButton({ templateId, seed, className = 'btn btn-small btn-ghost' }: { templateId: string; seed: number; className?: string }) {
  const saved = useSaved();
  const on = !!saved && !!saved[savedKey(templateId, seed)] && !saved[savedKey(templateId, seed)].removed;
  return (
    <button className={`${className} save-btn ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => void setSaved(templateId, seed, !on)} title={on ? 'Saved — press to take it off your list' : 'Save this question to come back to'}>
      <Icon name="star" /> {on ? 'Saved' : 'Save for later'}
    </button>
  );
}
