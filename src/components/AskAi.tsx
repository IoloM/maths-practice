/**
 * "Ask your AI app": free AI marking with no server and no API key. The question, the mark scheme,
 * the model solution, the answer and a picture of the working go to the student's own AI app
 * (Claude, ChatGPT, Gemini…) through the share sheet, or by copy and paste on a computer. The AI
 * app's own account does the marking, so this app pays nothing.
 */
import { useEffect, useRef, useState } from 'react';
import type { Part } from '../engine/templates/types';
import type { MarkResult, Response } from '../engine/marking/types';
import type { Working } from '../storage/types';
import { Icon } from './Icon';

const asText = (r: Response | undefined) => (r === undefined ? '' : typeof r === 'string' ? r : Array.isArray(r) ? r.filter(Boolean).join(', ') : Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('; '));

/** The message for the AI app (maths stays as LaTeX, which AI apps read well). */
export function markingPrompt(p: { stem: string; part: Part; response?: Response; result?: MarkResult; working: Working; hasPicture: boolean }): string {
  const { part } = p;
  const label = part.label ? `part (${part.label})` : 'the question';
  const lines = [
    `Please mark my answer to ${label} of this Edexcel A level Maths question, like an examiner using the mark scheme.`,
    '',
    p.stem.trim() && `Question: ${p.stem.trim()}`,
    `${part.label ? `(${part.label}) ` : ''}${part.prompt} [${part.marks} mark${part.marks === 1 ? '' : 's'}]`,
    '',
    'Mark scheme:',
    ...part.scheme.map((l) => `${l.code}: ${l.text}`),
    '',
    'Model solution:',
    ...part.solution,
    '',
    asText(p.response) && `My final answer: ${asText(p.response)}`,
    p.result && `The app's automatic answer check said: ${p.result.verdict}, ${p.result.score}/${p.result.max}.`,
    p.hasPicture ? 'My working is in the picture I have attached (it may cover other parts too — only mark this part).' : '',
    p.working.text.trim() && `My typed working:\n${p.working.text.trim()}`,
    '',
    'For each mark scheme line, say whether my working earns it and why, in one or two sentences, speaking to me as "you". Then give my total and the one thing I should fix or practise next. Don’t write out the whole solution again.',
  ];
  return lines
    .filter((l): l is string => typeof l === 'string')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface Props {
  stem: string;
  part: Part;
  working: Working;
  response?: Response;
  result?: MarkResult;
}

export function AskAi({ stem, part, working, response, result }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [png, setPng] = useState<Blob | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const text = markingPrompt({ stem, part, response, result, working, hasPicture: !!png });
  const where = part.label ? `part (${part.label})` : 'this question';

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const start = async () => {
    setNote(null);
    const { strokesToPng } = await import('../working/Canvas');
    const b64 = strokesToPng(working.strokes, 1600);
    setPng(b64 ? new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'image/png' }) : null);
    setOpen(true);
  };

  const file = png ? new File([png], 'my-working.png', { type: 'image/png' }) : null;
  const canShareFiles = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const canShare = typeof navigator.share === 'function' && (!file || canShareFiles);

  const share = () => {
    // no await before share(): Safari only allows it straight from the tap
    navigator.share(file ? { files: [file], text, title: 'Mark my maths' } : { text, title: 'Mark my maths' }).catch(() => {});
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNote('Question and mark scheme copied — paste them into your AI app.');
    } catch {
      setNote('Couldn’t copy — select the text below and copy it.');
    }
  };
  const copyPicture = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png! })]);
      setNote('Picture of your working copied — paste it into the same chat.');
    } catch {
      setNote('This browser can’t copy pictures — use Save picture instead.');
    }
  };
  const savePicture = () => {
    const url = URL.createObjectURL(png!);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-working.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <>
      <button type="button" className="btn btn-small" onClick={start}>
        <Icon name="share" /> Ask your AI app
      </button>
      <dialog ref={dialog} className="pad-dialog" aria-label={`Ask your AI app to mark ${where}`} onClose={() => setOpen(false)} onCancel={() => setOpen(false)}>
        {open && (
          <div className="stack">
            <h2 className="h3">Ask your AI app to mark this</h2>
            <p className="small">
              Send {png ? 'a picture of your working, ' : ''}the question and the mark scheme to Claude, ChatGPT or Gemini. It marks your working line by line on your own account — free for this app.
            </p>
            {!png && !working.text.trim() && <p className="small muted">You haven’t written any working yet, so the AI can only check your final answer.</p>}
            {canShare && (
              <div className="btn-row">
                <button type="button" className="btn btn-primary" onClick={share}>
                  <Icon name="share" /> Send to an app…
                </button>
              </div>
            )}
            <p className="small muted">{canShare ? 'Or copy and paste:' : 'Copy these into a chat with your AI app:'}</p>
            <div className="btn-row">
              <button type="button" className={`btn ${canShare ? '' : 'btn-primary'}`} onClick={copyText}>
                1. Copy question and mark scheme
              </button>
              {png && (
                <>
                  <button type="button" className="btn" onClick={copyPicture}>
                    2. Copy picture of working
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={savePicture}>
                    Save picture
                  </button>
                </>
              )}
            </div>
            <div className="btn-row">
              <a className="btn btn-small" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
                Open Claude
              </a>
              <a className="btn btn-small" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">
                Open ChatGPT
              </a>
              <a className="btn btn-small" href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">
                Open Gemini
              </a>
            </div>
            {note && (
              <p className="small" role="status">
                {note}
              </p>
            )}
            <details>
              <summary className="small">What gets sent</summary>
              <textarea className="ask-ai-text" readOnly value={text} aria-label="Message for your AI app" rows={8} />
            </details>
            <p className="small muted">AI marking can be wrong — check it against the mark scheme.</p>
            <div className="btn-row">
              <span className="spacer" />
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
