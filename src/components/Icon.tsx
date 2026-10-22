/** Inline SVG icons (no icon font, works offline). */
import { ICON_PATHS } from './icon-paths';

export function Icon({ name, size = 18, label }: { name: keyof typeof ICON_PATHS | string; size?: number; label?: string }) {
  const d = ICON_PATHS[name] ?? ICON_PATHS.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
