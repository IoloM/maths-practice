/** Titles and links for an answered question: one from the question bank, or from Mr Astbury's booklet. */
import { ENTRY_BY_ID } from '../content/bank-meta';
import { BOOKLET_QUESTION, BOOKLET_SECTION } from '../content/astbury';
import { bookletQuestionId, isBookletAttempt } from './booklet';
import { href } from '../router';

export function questionTitle(templateId: string): string {
  if (isBookletAttempt(templateId)) {
    const q = BOOKLET_QUESTION.get(bookletQuestionId(templateId));
    const s = q && BOOKLET_SECTION.get(q.section);
    return s ? `Mr Astbury ${s.ref} ${s.title}: question ${q.n}` : 'Mr Astbury’s booklet';
  }
  return ENTRY_BY_ID.get(templateId)?.title ?? templateId;
}

/** Where to see the question again. */
export function questionHref(templateId: string, seed: number): string {
  if (isBookletAttempt(templateId)) {
    const q = BOOKLET_QUESTION.get(bookletQuestionId(templateId));
    return q ? href(`/booklet/${q.section}/${q.n}`) : href('/booklet');
  }
  return href(`/q/${templateId}/${seed}`);
}

/** More questions like it in the app. */
export function practiceHref(templateId: string, chapter: string): string {
  return isBookletAttempt(templateId) ? href('/practice', { c: chapter }) : href('/practice', { t: templateId });
}
