import type { ReactNode } from 'react';

export function Difficulty({ d }: { d: number }) {
  return (
    <span className="diff" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= d ? 'on' : ''} />
      ))}
    </span>
  );
}

export type Rag = 'r' | 'a' | 'g' | 'none';
export function ragOf(mastery: number | null): Rag {
  if (mastery === null) return 'none';
  if (mastery < 0.5) return 'r';
  if (mastery < 0.8) return 'a';
  return 'g';
}
const RAG_TEXT: Record<Rag, string> = { r: 'Red', a: 'Amber', g: 'Green', none: 'Not started' };
export function RagBadge({ mastery }: { mastery: number | null }) {
  const r = ragOf(mastery);
  return (
    <span className={`rag rag-${r}`}>
      {RAG_TEXT[r]}
      {mastery !== null ? ` ${Math.round(mastery * 100)}%` : ''}
    </span>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="muted" role="status">
      {label}
    </p>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="error-box" role="alert">
      {children}
    </div>
  );
}
