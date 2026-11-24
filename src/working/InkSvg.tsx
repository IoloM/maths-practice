/** Handwriting drawn as SVG (to look at or print), the same as on the canvas. */
import type { Stroke } from '../storage/types';
import { dashPattern, HIGHLIGHT_ALPHA, paperColour, strokeSvg } from './ink';

export function InkPaths({ strokes }: { strokes: Stroke[] }) {
  return (
    <>
      {strokes.map((s, k) => {
        const g = strokeSvg(s);
        const c = paperColour(s.color);
        const op = s.tool === 'highlighter' ? HIGHLIGHT_ALPHA : 1;
        if ('fill' in g) return <path key={k} d={g.fill} fill={c} fillOpacity={op} />;
        const line = { fill: 'none', stroke: c, strokeOpacity: op, strokeWidth: s.size, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
        return (
          <g key={k}>
            <path d={g.line} {...line} strokeDasharray={s.dash ? dashPattern(s).join(' ') : undefined} />
            {g.heads && <path d={g.heads} {...line} />}
          </g>
        );
      })}
    </>
  );
}
