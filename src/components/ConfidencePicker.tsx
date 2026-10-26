import { LEVELS, type Level } from '../lib/confidence';
import { setConfidence } from '../lib/topics';

/** Not yet / Getting there / Confident for a topic (press the chosen one again to clear it). */
export function ConfidencePicker({ chapter, title, value }: { chapter: string; title: string; value: Level | undefined }) {
  return (
    <div className="confidence-picker" role="group" aria-label={`How confident are you with ${title}?`}>
      {LEVELS.map((l) => (
        <button key={l.v} type="button" className={`btn btn-small conf-${l.v} ${value === l.v ? 'on' : ''}`} aria-pressed={value === l.v} onClick={() => void setConfidence(chapter, value === l.v ? undefined : l.v)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
