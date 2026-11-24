/** The pen's tools and options (small, so the toolbar loads without the drawing canvas). */
export type ShapeKind = 'line' | 'arrow' | 'rect' | 'ellipse' | 'triangle' | 'axes' | 'axes1';
export type Tool = 'pen' | 'highlighter' | 'eraser' | 'lasso' | 'hand' | ShapeKind;
export const SHAPE_TOOLS: ShapeKind[] = ['line', 'arrow', 'rect', 'ellipse', 'triangle', 'axes', 'axes1'];
export const isShape = (t: Tool): t is ShapeKind => (SHAPE_TOOLS as string[]).includes(t);

export interface InkOptions {
  /** a long line that is nearly straight becomes straight */
  straighten: boolean;
  /** smooth the wobble out of handwriting as you write */
  neaten: boolean;
  /** pressing harder makes the pen thicker (a brush pen) */
  pressure: boolean;
  /** the rubber takes whole strokes, or only the part it touches */
  eraser: 'stroke' | 'part';
  /** shapes are drawn dashed */
  dash: boolean;
}
export const DEFAULT_OPTIONS: InkOptions = { straighten: true, neaten: false, pressure: false, eraser: 'stroke', dash: false };
