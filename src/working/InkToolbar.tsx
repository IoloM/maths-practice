/**
 * The pen's toolbar, shared by the working area and Mr Astbury's booklet: pen, highlighter,
 * rubber, lasso, shapes and the hand; colours (the four you use most, a palette, and any colour);
 * thickness; and the pen's settings (straighten lines, neaten handwriting, pressure, the rubber,
 * Pencil only). Choices are kept on the device (settings.ink).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_INK, useSettings, type InkPrefs } from '../lib/settings';
import { isShape, type InkOptions, type ShapeKind, type Tool } from './tools';
import { Icon } from '../components/Icon';

export const PEN_PALETTE = [
  { c: 'currentColor', name: 'Black' },
  { c: '#1a5fd0', name: 'Blue' },
  { c: '#c62828', name: 'Red' },
  { c: '#2e7d32', name: 'Green' },
  { c: '#ef6c00', name: 'Orange' },
  { c: '#7b1fa2', name: 'Purple' },
  { c: '#00838f', name: 'Teal' },
  { c: '#c2185b', name: 'Pink' },
  { c: '#6d4c41', name: 'Brown' },
  { c: '#757575', name: 'Grey' },
];
export const HIGHLIGHTER_PALETTE = [
  { c: '#ffd60a', name: 'Yellow' },
  { c: '#7ee081', name: 'Green' },
  { c: '#ff8fab', name: 'Pink' },
  { c: '#7cc6fe', name: 'Blue' },
  { c: '#ffb347', name: 'Orange' },
];
const PEN_SIZES = [
  { size: 1.5, name: 'Fine' },
  { size: 2.25, name: 'Medium' },
  { size: 3, name: 'Bold' },
  { size: 4.5, name: 'Thick' },
];
const HL_SIZES = [
  { size: 8, name: 'Thin' },
  { size: 12, name: 'Medium' },
  { size: 18, name: 'Wide' },
];
export const SHAPES: { kind: ShapeKind; name: string }[] = [
  { kind: 'line', name: 'Line' },
  { kind: 'arrow', name: 'Arrow' },
  { kind: 'rect', name: 'Rectangle' },
  { kind: 'ellipse', name: 'Circle or ellipse' },
  { kind: 'triangle', name: 'Triangle' },
  { kind: 'axes', name: 'Axes' },
  { kind: 'axes1', name: 'Axes (one quadrant)' },
];
const colourName = (c: string) => [...PEN_PALETTE, ...HIGHLIGHTER_PALETTE].find((p) => p.c === c)?.name ?? 'Your colour';
/** the black swatch shows the ink as it will look (light in dark mode in the working area) */
const swatchBg = (c: string) => (c === 'currentColor' ? 'var(--ink-swatch, #111)' : c);

export interface Ink {
  tool: Tool;
  setTool: (t: Tool) => void;
  prefs: InkPrefs;
  set: (p: Partial<InkPrefs>) => void;
  colour: string;
  size: number;
  options: InkOptions;
  pickColour: (c: string) => void;
  setSize: (n: number) => void;
  pencilOnly: boolean;
  setPencilOnly: (on: boolean) => void;
  /** call when an Apple Pencil touches the page: the first time, Pencil only goes on */
  onPen: () => void;
  notice: string | null;
  clearNotice: () => void;
}

/** The pen's state: the tool (for this page) and the choices kept on the device. */
export function useInk(): Ink {
  const { settings, update } = useSettings();
  const prefs: InkPrefs = { ...DEFAULT_INK, ...settings.ink };
  const [tool, setTool] = useState<Tool>('pen');
  const [notice, setNotice] = useState<string | null>(null);
  const set = (p: Partial<InkPrefs>) => update({ ink: { ...prefs, ...p } });
  const hl = tool === 'highlighter';
  return {
    tool,
    setTool,
    prefs,
    set,
    colour: hl ? prefs.hlColour : prefs.colour,
    size: hl ? prefs.hlSize : prefs.size,
    options: { straighten: prefs.straighten, neaten: prefs.neaten, pressure: prefs.pressure, eraser: prefs.eraser, dash: prefs.dash },
    pickColour(c) {
      if (hl) set({ hlColour: c });
      else {
        set({ colour: c, recent: [c, ...prefs.recent.filter((x) => x !== c)].slice(0, 4) });
        if (tool === 'eraser' || tool === 'lasso' || tool === 'hand') setTool('pen');
      }
    },
    setSize: (n) => set(hl ? { hlSize: n } : { size: n }),
    pencilOnly: settings.pencilOnly,
    setPencilOnly: (on) => update({ pencilOnly: on }),
    onPen() {
      if (prefs.pencilSeen) return;
      if (!settings.pencilOnly) {
        update({ pencilOnly: true, ink: { ...prefs, pencilSeen: true } });
        setNotice('Apple Pencil found: now the Pencil writes and your fingers scroll. Tap with two fingers to undo. (Pen settings to change it.)');
      } else set({ pencilSeen: true });
    },
    notice,
    clearNotice: () => setNotice(null),
  };
}

type Panel = 'colour' | 'size' | 'shapes' | 'settings';

interface Props {
  ink: Ink;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  clearLabel: string;
  clearDisabled?: boolean;
  /** extra controls for this page (paper, zoom, export) */
  extra?: ReactNode;
  /** stays at the top of the screen as you scroll (on the booklet's pages) */
  sticky?: boolean;
}

export function InkToolbar({ ink, canUndo, canRedo, onUndo, onRedo, onClear, clearLabel, clearDisabled, extra, sticky }: Props) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [lastShape, setLastShape] = useState<ShapeKind>('line');
  const ref = useRef<HTMLDivElement>(null);
  const toggle = (p: Panel) => setPanel((x) => (x === p ? null : p));
  // a panel closes when you tap elsewhere or press Esc
  useEffect(() => {
    if (!panel) return;
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPanel(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [panel]);
  const { tool, prefs } = ink;
  const hl = tool === 'highlighter';
  const quick = hl ? HIGHLIGHTER_PALETTE.slice(0, 4) : prefs.recent.slice(0, 4).map((c) => ({ c, name: colourName(c) }));
  const sizes = hl ? HL_SIZES : PEN_SIZES;
  const sizeName = sizes.find((s) => Math.abs(s.size - ink.size) < 0.01)?.name ?? `${ink.size}`;
  const shapeNow = isShape(tool) ? (tool as ShapeKind) : lastShape;
  const toolBtn = (t: Tool, icon: string, name: string, title = name) => (
    <button
      className="tool"
      aria-pressed={tool === t}
      aria-label={name}
      title={title}
      onClick={() => {
        ink.setTool(t);
        setPanel(null);
      }}
    >
      <Icon name={icon} />
    </button>
  );
  return (
    <div className={`ink-bar ${sticky ? 'ink-bar-sticky' : ''}`} ref={ref}>
      <div className="toolbar ink-toolbar" role="toolbar" aria-label="Pen and paper">
        {toolBtn('pen', 'pen', 'Pen')}
        {toolBtn('highlighter', 'highlighter', 'Highlighter')}
        {toolBtn('eraser', 'eraser', 'Rubber', prefs.eraser === 'part' ? 'Rubber: rubs out what it touches' : 'Rubber: touch a stroke to rub it out')}
        {toolBtn('lasso', 'lasso', 'Lasso', 'Lasso: loop round writing to move, resize, neaten or level it')}
        <button
          className="tool"
          aria-pressed={isShape(tool)}
          aria-expanded={panel === 'shapes'}
          aria-label="Shapes"
          title="Shapes: line, arrow, rectangle, circle, triangle, axes"
          onClick={() => {
            if (!isShape(tool)) ink.setTool(lastShape);
            toggle('shapes');
          }}
        >
          <Icon name={isShape(tool) ? shapeNow : 'shapes'} />
        </button>
        {toolBtn('hand', 'hand', 'Scroll with a finger', 'Hand: scroll and move about without writing')}
        <span className="ink-sep" aria-hidden="true" />
        {quick.map((p) => (
          <button key={p.c} className="tool" aria-pressed={ink.colour === p.c} aria-label={`${p.name} ${hl ? 'highlighter' : 'ink'}`} title={p.name} onClick={() => ink.pickColour(p.c)}>
            <span className="swatch" style={{ background: swatchBg(p.c) }} />
          </button>
        ))}
        <button className="tool" aria-expanded={panel === 'colour'} aria-label="More colours" title="More colours" onClick={() => toggle('colour')}>
          <Icon name="palette" />
        </button>
        <button className="tool ink-size-btn" aria-expanded={panel === 'size'} aria-label={`Thickness: ${sizeName}`} title="Thickness" onClick={() => toggle('size')}>
          <span className="ink-size-dot" style={{ width: Math.min(18, 3 + ink.size * (hl ? 0.8 : 2.4)), height: Math.min(18, 3 + ink.size * (hl ? 0.8 : 2.4)), background: swatchBg(ink.colour), opacity: hl ? 0.6 : 1 }} />
        </button>
        {extra}
        <span className="spacer" />
        <button className="tool" aria-label="Undo" title="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo}>
          <Icon name="undo" />
        </button>
        <button className="tool" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!canRedo} onClick={onRedo}>
          <Icon name="redo" />
        </button>
        <button className="tool" aria-label={clearLabel} title={clearLabel} disabled={clearDisabled} onClick={onClear}>
          <Icon name="trash" />
        </button>
        <button className="tool" aria-expanded={panel === 'settings'} aria-label="Pen settings" title="Pen settings" onClick={() => toggle('settings')}>
          <Icon name="settings" />
        </button>
      </div>
      {panel === 'shapes' && (
        <div className="ink-panel" role="group" aria-label="Shapes">
          <div className="ink-grid">
            {SHAPES.map((s) => (
              <button
                key={s.kind}
                className="ink-choice"
                aria-pressed={tool === s.kind}
                onClick={() => {
                  ink.setTool(s.kind);
                  setLastShape(s.kind);
                  setPanel(null);
                }}
              >
                <Icon name={s.kind} /> {s.name}
              </button>
            ))}
          </div>
          <label className="row small">
            <input type="checkbox" checked={prefs.dash} onChange={(e) => ink.set({ dash: e.target.checked })} /> Dashed lines (for asymptotes)
          </label>
          <p className="small muted" style={{ margin: 0 }}>
            Drag out the shape (axes: press where the origin goes). Or draw it freehand and hold the pen still at the end: it snaps into a straight line, circle, triangle or rectangle.
          </p>
        </div>
      )}
      {panel === 'colour' && (
        <div className="ink-panel" role="group" aria-label={hl ? 'Highlighter colours' : 'Pen colours'}>
          <div className="ink-palette">
            {(hl ? HIGHLIGHTER_PALETTE : PEN_PALETTE).map((p) => (
              <button key={p.c} className="tool" aria-pressed={ink.colour === p.c} aria-label={`${p.name} ${hl ? 'highlighter' : 'ink'}`} title={p.name} onClick={() => ink.pickColour(p.c)}>
                <span className="swatch" style={{ background: swatchBg(p.c) }} />
              </button>
            ))}
            {!hl && (
              <label className="ink-custom" title="Any colour">
                <input type="color" aria-label="Choose any colour" value={/^#[0-9a-f]{6}$/i.test(ink.colour) ? ink.colour : '#111111'} onChange={(e) => ink.pickColour(e.target.value)} />
                <span className="small">Any colour</span>
              </label>
            )}
          </div>
        </div>
      )}
      {panel === 'size' && (
        <div className="ink-panel" role="group" aria-label="Thickness">
          <div className="ink-grid">
            {sizes.map((s) => (
              <button key={s.size} className="ink-choice" aria-pressed={Math.abs(ink.size - s.size) < 0.01} onClick={() => ink.setSize(s.size)}>
                <span className="ink-line-sample" style={{ height: Math.max(1, s.size * (hl ? 1 : 1.3)), background: swatchBg(ink.colour), opacity: hl ? 0.6 : 1 }} /> {s.name}
              </button>
            ))}
          </div>
          <label className="row small">
            Thickness
            <input type="range" min={hl ? 4 : 0.75} max={hl ? 28 : 8} step={hl ? 1 : 0.25} value={ink.size} onChange={(e) => ink.setSize(Number(e.target.value))} style={{ flex: 1 }} />
          </label>
        </div>
      )}
      {panel === 'settings' && (
        <div className="ink-panel stack" role="group" aria-label="Pen settings" style={{ gap: 8 }}>
          <label className="row small">
            <input type="checkbox" checked={prefs.straighten} onChange={(e) => ink.set({ straighten: e.target.checked })} />
            <span>
              <b>Straighten lines</b>: a long line that’s nearly straight comes out straight (and level when it’s nearly level)
            </span>
          </label>
          <label className="row small">
            <input type="checkbox" checked={prefs.neaten} onChange={(e) => ink.set({ neaten: e.target.checked })} />
            <span>
              <b>Neaten my handwriting</b>: smooth out the wobbles as you write
            </span>
          </label>
          <label className="row small">
            <input type="checkbox" checked={prefs.pressure} onChange={(e) => ink.set({ pressure: e.target.checked })} />
            <span>
              <b>Pressure changes the thickness</b> (a brush pen). Off: the same thickness however hard you press
            </span>
          </label>
          <fieldset className="ink-fieldset small">
            <legend>The rubber rubs out</legend>
            <label className="row">
              <input type="radio" name="ink-eraser" checked={prefs.eraser === 'stroke'} onChange={() => ink.set({ eraser: 'stroke' })} /> whole strokes
            </label>
            <label className="row">
              <input type="radio" name="ink-eraser" checked={prefs.eraser === 'part'} onChange={() => ink.set({ eraser: 'part' })} /> just what it touches
            </label>
          </fieldset>
          <label className="row small">
            <input type="checkbox" checked={ink.pencilOnly} onChange={(e) => ink.setPencilOnly(e.target.checked)} />
            <span>
              <b>Pencil only</b>: the Apple Pencil writes, fingers scroll (tap with two fingers to undo, three to redo)
            </span>
          </label>
          <p className="small muted" style={{ margin: 0 }}>
            Hold the pen still at the end of a line or shape and it snaps straight. Loop round writing with the lasso to move it, resize it from the corner dot, or neaten, level, recolour, copy or delete it.
          </p>
        </div>
      )}
      {ink.notice && (
        <p className="ink-notice small" role="status">
          <span style={{ flex: 1 }}>{ink.notice}</span>
          <button className="btn btn-small" onClick={ink.clearNotice}>
            OK
          </button>
        </p>
      )}
    </div>
  );
}
