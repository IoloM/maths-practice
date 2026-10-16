import { memo } from 'react';
import { renderMarkdown } from '../lib/markdown';

/** Renders Markdown-lite with $LaTeX$ via KaTeX (HTML + MathML for screen readers). */
export const MathText = memo(function MathText({ src, inline, className, as }: { src: string; inline?: boolean; className?: string; as?: 'div' | 'span' }) {
  const Tag = as ?? (inline ? 'span' : 'div');
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(src, { inline }) }} />;
});

/** A single LaTeX expression. */
export const Tex = memo(function Tex({ tex, display }: { tex: string; display?: boolean }) {
  return <MathText src={display ? `$$${tex}$$` : `$${tex}$`} inline={!display} />;
});
