/**
 * Which course the student is taking. "AS" (8MA0) covers the Year 1 books only (Pure 1 and
 * Statistics and Mechanics 1): topics, practice, mocks and the predicted grade follow it.
 */
export type Course = 'alevel' | 'as';

export const AS_BOOKS = ['P1', 'SM1'] as const;
/** Is this textbook (P1, P2, SM1, SM2) part of the course? */
export const bookInCourse = (course: Course, book: string) => course === 'alevel' || (AS_BOOKS as readonly string[]).includes(book);
/** Is this chapter (e.g. 'P2.3') part of the course? */
export const chapterInCourse = (course: Course, ref: string) => bookInCourse(course, ref.split('.')[0]);
/** Mock papers are tagged with their paper id; the AS ones start "as". */
export const isASMock = (paper: string | undefined) => !!paper?.startsWith('as');
