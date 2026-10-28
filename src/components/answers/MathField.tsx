import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../lib/settings';

let loading: Promise<unknown> | null = null;
let loaded = false;
export function loadMathLive(): Promise<unknown> {
  if (!loading)
    loading = import('./mathlive-setup').then((m) => {
      m.setup();
      loaded = true;
    });
  return loading;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'math-virtual-keyboard-policy'?: string;
        'smart-mode'?: string;
        'smart-fence'?: string;
        'default-mode'?: string;
        'read-only'?: boolean | string;
      };
    }
  }
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

type MF = HTMLElement & { value: string; mathVirtualKeyboardPolicy: string; smartMode: boolean; inlineShortcuts: Record<string, string>; menuItems: unknown[] };

/** MathLive field, lazy-loaded; until it loads (or if the user prefers) a plain text box that accepts typed maths. */
export function MathField({ value, onChange, onEnter, ariaLabel, placeholder, disabled, id }: Props) {
  const { settings } = useSettings();
  const plain = settings.input === 'plain';
  const [ready, setReady] = useState(loaded);
  const [failed, setFailed] = useState(false);
  const ref = useRef<MF | null>(null);
  const plainBox = useRef<HTMLInputElement | null>(null);
  /** the plain box had the focus when MathLive replaced it: give the focus to the new field */
  const refocus = useRef(false);
  const cb = useRef({ onChange, onEnter });
  cb.current = { onChange, onEnter };

  useEffect(() => {
    if (plain || ready) return;
    let alive = true;
    loadMathLive()
      .then(() => {
        if (!alive) return;
        refocus.current = !!plainBox.current && document.activeElement === plainBox.current;
        setReady(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [plain, ready]);

  useEffect(() => {
    const mf = ref.current;
    if (!mf || !ready || plain) return;
    if (mf.value !== value) mf.value = value;
  }, [value, ready, plain]);

  useEffect(() => {
    const mf = ref.current;
    if (!mf || !ready || plain) return;
    mf.smartMode = false;
    try {
      mf.menuItems = [];
    } catch {
      /* older versions */
    }
    const onInput = () => cb.current.onChange(mf.value);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        cb.current.onEnter?.();
      }
    };
    mf.addEventListener('input', onInput);
    mf.addEventListener('keydown', onKey);
    if (refocus.current) {
      refocus.current = false;
      mf.focus();
    }
    return () => {
      mf.removeEventListener('input', onInput);
      mf.removeEventListener('keydown', onKey);
    };
  }, [ready, plain]);

  if (plain || !ready || failed) {
    return (
      <input
        ref={plainBox}
        id={id}
        className="text-answer"
        type="text"
        value={value}
        disabled={disabled}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={ariaLabel}
        placeholder={placeholder ?? 'e.g. 3x^2 + 2/x, sqrt(5), pi/4'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
      />
    );
  }
  return (
    <math-field
      id={id}
      ref={(el) => {
        ref.current = el as MF | null;
      }}
      aria-label={ariaLabel}
      math-virtual-keyboard-policy="auto"
      read-only={disabled ? 'true' : undefined}
    />
  );
}
