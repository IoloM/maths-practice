/** The student's own exam dates, for the countdown on the home page. */
export const EXAM_PAPERS = [
  { id: '1', label: 'Paper 1: Pure Mathematics 1' },
  { id: '2', label: 'Paper 2: Pure Mathematics 2' },
  { id: '3', label: 'Paper 3: Statistics and Mechanics' },
] as const;
export type ExamPaperId = (typeof EXAM_PAPERS)[number]['id'];
export type ExamDates = Partial<Record<ExamPaperId, string>>;

/** Whole days from today to a YYYY-MM-DD date (0 = today), counted on the calendar, not in hours. */
export function daysUntil(iso: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
}

/** Exams still to come (including today), soonest first. */
export function upcomingExams(dates: ExamDates, now = new Date()) {
  return EXAM_PAPERS.flatMap((p) => {
    const iso = dates[p.id];
    const days = iso ? daysUntil(iso, now) : null;
    return iso && days !== null && days >= 0 ? [{ ...p, date: iso, days }] : [];
  }).sort((a, b) => a.days - b.days);
}

export const formatExamDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
