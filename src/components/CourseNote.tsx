import { href } from '../router';

/** Under a list that AS mode has cut down to Year 1. */
export function CourseNote() {
  return (
    <p className="small muted" style={{ margin: 0 }}>
      Showing AS topics (Year 1) only. <a href={href('/settings')}>Doing the full A level? Change it in Settings</a>.
    </p>
  );
}
