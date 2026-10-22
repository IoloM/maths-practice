/**
 * Diagram SVG for embedding inside a labelled wrapper (role="img" + aria-label). The inner <svg>
 * must not announce itself a second time, so its own role is replaced by aria-hidden.
 */
export function diagramHtml(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => `<svg${attrs.replace(/\s+role="img"/, '')} aria-hidden="true" focusable="false">`);
}
