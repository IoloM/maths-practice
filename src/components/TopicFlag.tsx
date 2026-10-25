import { FLAGS, setFlag, useTopicMarks, type TopicFlag as Flag } from '../lib/topics';
import { CHAPTER_BY_REF } from '../content/chapters';
import { href } from '../router';
import { Icon } from './Icon';

/** "I need help with this" / "I want to learn this" for a topic (press again to clear). */
export function TopicFlagButtons({ chapter, compact = false }: { chapter: string; compact?: boolean }) {
  const marks = useTopicMarks();
  const now = marks?.[chapter]?.flag ?? null;
  const title = CHAPTER_BY_REF.get(chapter as never)?.title ?? chapter;
  return (
    <div className="flag-buttons" role="group" aria-label={`Mark ${title}`}>
      {FLAGS.map((f) => (
        <button key={f.id} type="button" className={`btn btn-small flag-${f.id} ${now === f.id ? 'on' : ''}`} aria-pressed={now === f.id} onClick={() => void setFlag(chapter, now === f.id ? null : f.id)}>
          <Icon name={f.id === 'help' ? 'info' : 'target'} /> {compact ? f.short : f.label}
        </button>
      ))}
      {now && (
        <a className="btn btn-small btn-ghost" href={href(`/learn/${chapter}`)}>
          <Icon name="book" /> Learn it
        </a>
      )}
    </div>
  );
}

/** A small chip showing a topic's mark, for lists. */
export function FlagChip({ flag }: { flag: Flag | null | undefined }) {
  if (!flag) return null;
  return <span className={`chip flag-chip flag-${flag}`}>{FLAGS.find((f) => f.id === flag)!.short}</span>;
}
