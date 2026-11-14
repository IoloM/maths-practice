/**
 * `#/booklet`: Mr Astbury's A Level Exam Qs Series (Pure), from the student's own copy of the PDF.
 * Work through it chapter by chapter in the app: each question shows its page from the booklet,
 * with space for your answer and working (saved as you go), a "done" tick, the worked solution to
 * check against, and a record of the chapters you've finished to print or save as a PDF for him.
 *
 *   #/booklet                 chapters, progress, and loading the booklets onto this device
 *   #/booklet/<section>       the questions in a chapter
 *   #/booklet/<section>/<n>   one question
 *   #/booklet/record?s=…      the record to print for Mr Astbury
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { BOOKLET, BOOKLET_PAGES, BOOKLET_SECTION, SOLUTIONS_PAGES, type BookletQuestion, type BookletSection } from '../content/astbury';
import { loadBookletFile, removeBookletFile, saveBookletFile, type BookletFile, type StoredFile } from '../lib/booklet-files';
import { hasWorking, sectionProgress, updateBookletWork, useBookletWork, type BookletWork, type BookletWorks, type Check } from '../lib/booklet';
import { openPdf, renderPage } from '../lib/pdf';
import { useSettings } from '../lib/settings';
import { currentLogin } from '../lib/logins';
import { href, navigate } from '../router';
import { WorkingArea, emptyWorking } from '../working/WorkingArea';
import { ErrorBox, Loading, plural } from '../components/bits';
import { Icon } from '../components/Icon';
import type { Stroke, Working } from '../storage/types';

const FILE_LABEL: Record<BookletFile, string> = { questions: 'question booklet', solutions: 'worked solutions' };
const EXPECTED: Record<BookletFile, number> = { questions: BOOKLET_PAGES, solutions: SOLUTIONS_PAGES };
const day = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// ------------------------------------------------------------------ the PDFs on this device

const docs: Partial<Record<BookletFile, Promise<PDFDocumentProxy | null>>> = {};
const infoCache: Partial<Record<BookletFile, StoredFile | null>> = {};

function openStored(kind: BookletFile): Promise<PDFDocumentProxy | null> {
  docs[kind] ??= loadBookletFile(kind).then((f) => {
    infoCache[kind] = f ?? null;
    return f ? openPdf(f.data) : null;
  });
  return docs[kind]!;
}

/** The two booklets as loaded on this device (null = not loaded; undefined = still looking). */
function useBooklets() {
  const [state, setState] = useState<{ questions?: PDFDocumentProxy | null; solutions?: PDFDocumentProxy | null; error?: string }>({});
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    void Promise.all([openStored('questions'), openStored('solutions')])
      .then(([questions, solutions]) => alive && setState({ questions, solutions }))
      .catch(() => alive && setState({ questions: null, solutions: null, error: 'That file could not be opened as a PDF.' }));
    return () => {
      alive = false;
    };
  }, [n]);
  return { ...state, reload: () => setN((x) => x + 1) };
}

async function loadFile(kind: BookletFile, file: File): Promise<string | null> {
  const data = await file.arrayBuffer();
  let pages = 0;
  try {
    const doc = await openPdf(data);
    pages = doc.numPages;
  } catch {
    return 'That file could not be opened as a PDF.';
  }
  if (pages !== EXPECTED[kind]) return `That PDF has ${pages} pages, but Mr Astbury’s ${FILE_LABEL[kind]} (version 3) has ${EXPECTED[kind]}. Check you chose the right file.`;
  await saveBookletFile({ kind, name: file.name, data, pages, savedAt: Date.now() });
  delete docs[kind];
  return null;
}

/** Choose (or replace, or remove) one of the booklets. */
function FilePicker({ kind, loaded, onChange }: { kind: BookletFile; loaded: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const label = kind === 'questions' ? 'Mr Astbury – A Level Exam Qs Series – Pure (PDF)' : 'Mr Astbury Pure – Full Worked Solutions (PDF)';
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="row" style={{ alignItems: 'center' }}>
        <span style={{ flex: 1 }}>
          {loaded ? <Icon name="check" /> : null} <b>{kind === 'questions' ? 'Question booklet' : 'Worked solutions'}</b>
          <span className="muted small"> · {loaded ? `loaded (${infoCache[kind]?.name ?? 'on this device'})` : kind === 'questions' ? 'needed' : 'optional, to check your answers'}</span>
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          aria-label={label}
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(await loadFile(kind, f));
            setBusy(false);
            onChange();
          }}
        />
      </label>
      {busy && <p className="small muted" role="status" style={{ margin: 0 }}>Loading the PDF…</p>}
      {err && <p className="small warn-text" role="alert" style={{ margin: 0 }}>{err}</p>}
      {loaded && (
        <button
          className="btn btn-small btn-ghost"
          style={{ alignSelf: 'flex-start' }}
          onClick={async () => {
            if (!window.confirm(`Remove the ${FILE_LABEL[kind]} from this device? Your answers and working are kept.`)) return;
            await removeBookletFile(kind);
            delete docs[kind];
            onChange();
          }}
        >
          Remove from this device
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ a page of a booklet

/** A page (or a few) of a booklet, drawn to fit the column; the blank space under a question is trimmed. */
function PdfPages({ doc, from, count, label, trim = true }: { doc: PDFDocumentProxy; from: number; count: number; label: string; trim?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let alive = true;
    const width = Math.min(900, el.clientWidth || 600);
    void (async () => {
      try {
        const canvases: HTMLCanvasElement[] = [];
        for (let p = from; p < from + count; p++) canvases.push(await renderPage(doc, p, width, trim && p === from + count - 1));
        if (!alive) return;
        el.replaceChildren(
          ...canvases.map((c) => {
            c.style.width = '100%';
            c.style.height = 'auto';
            c.className = 'booklet-page';
            return c;
          }),
        );
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [doc, from, count, trim]);
  return (
    <>
      <div ref={box} className="booklet-pages" role="img" aria-label={label}>
        <Loading label="Drawing the page…" />
      </div>
      {error && <ErrorBox>That page could not be drawn.</ErrorBox>}
    </>
  );
}

// ------------------------------------------------------------------ chapters

function ChapterRow({ s, works }: { s: BookletSection; works: BookletWorks }) {
  const p = sectionProgress(works, s);
  return (
    <li>
      <a className="list-link" href={href(`/booklet/${s.id}`)}>
        <span className="chip">{s.ref}</span>
        <span style={{ flex: 1 }}>
          {s.title}
          {p.complete && p.finishedAt && <span className="small muted"> · finished {day(p.finishedAt)}</span>}
        </span>
        <span className="booklet-bar" aria-hidden="true">
          <span style={{ width: `${(100 * p.done) / p.total}%` }} />
        </span>
        <span className={`chip ${p.complete ? 'chip-accent' : ''}`}>{p.complete ? <>✓ Done</> : `${p.done}/${p.total}`}</span>
      </a>
    </li>
  );
}

function BookletHome() {
  const b = useBooklets();
  const works = useBookletWork();
  const totals = useMemo(() => {
    if (!works) return null;
    const all = BOOKLET.map((s) => sectionProgress(works, s));
    return { done: all.reduce((t, p) => t + p.done, 0), total: all.reduce((t, p) => t + p.total, 0), chapters: all.filter((p) => p.complete).length };
  }, [works]);
  if (b.questions === undefined || !works) return <Loading />;
  const ready = !!b.questions;
  return (
    <div className="stack">
      <div>
        <h1>Mr Astbury’s booklet</h1>
        <p className="muted">
          The A Level Exam Qs Series (Pure), chapter by chapter: each question with space for your answer and working, saved as you go. Tick each one off, check it against the worked solution, and print a record of
          the chapters you’ve finished to show Mr Astbury.
        </p>
      </div>
      <section className="card stack" aria-labelledby="files-h">
        <h2 id="files-h" className="h3">
          {ready ? 'The booklets on this device' : 'Load the booklet'}
        </h2>
        {!ready && (
          <p className="small" style={{ margin: 0 }}>
            Choose your copy of the PDF (for example from iCloud Drive → School → Maths). It stays on this device: it isn’t uploaded or shared, so do this once on each device you use.
          </p>
        )}
        <FilePicker kind="questions" loaded={!!b.questions} onChange={b.reload} />
        <FilePicker kind="solutions" loaded={!!b.solutions} onChange={b.reload} />
        {b.error && <ErrorBox>{b.error}</ErrorBox>}
      </section>
      {totals && (
        <section className="card" aria-label="Booklet progress">
          <div className="week-kpis">
            <div>
              <b>
                {totals.done}/{totals.total}
              </b>
              <span className="muted small">questions done</span>
            </div>
            <div>
              <b>
                {totals.chapters}/{BOOKLET.length}
              </b>
              <span className="muted small">sections finished</span>
            </div>
          </div>
          <div className="btn-row">
            <a className="btn btn-primary" href={href('/booklet/record')}>
              <Icon name="download" /> Record for Mr Astbury
            </a>
          </div>
        </section>
      )}
      {([1, 2] as const).map((y) => (
        <section key={y} className={`card ${y === 2 ? 'year-2' : ''}`} aria-labelledby={`by-${y}`}>
          <h2 id={`by-${y}`} className="h3">
            Pure Year {y}
          </h2>
          <ul className="list">
            {BOOKLET.filter((s) => s.year === y).map((s) => (
              <ChapterRow key={s.id} s={s} works={works} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SectionPage({ s }: { s: BookletSection }) {
  const works = useBookletWork();
  if (!works) return <Loading />;
  const p = sectionProgress(works, s);
  const next = s.questions.find((q) => !works[q.id]?.done) ?? s.questions[0];
  return (
    <div className={`stack ${s.year === 2 ? 'year-2' : ''}`}>
      <div>
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href('/booklet')}>← Mr Astbury’s booklet</a>
        </p>
        <h1>
          {s.ref} {s.title}
        </h1>
        <p className="muted">
          {p.done} of {plural(s.questions.length, 'question')} done{p.complete && p.finishedAt ? ` · finished ${day(p.finishedAt)}` : ''}
          {p.of ? ` · ${p.got}/${p.of} marks against the worked solutions` : ''}
        </p>
        <div className="btn-row">
          <a className="btn btn-primary" href={href(`/booklet/${s.id}/${next.n}`)}>
            <Icon name="play" /> {p.done ? (p.complete ? 'Look back through' : 'Carry on') : 'Start'}
          </a>
          <a className="btn" href={href('/booklet/record', { s: s.id })}>
            <Icon name="download" /> Record of this chapter
          </a>
          <a className="btn" href={href('/practice', { c: s.chapter })}>
            Practise this topic in the app
          </a>
        </div>
      </div>
      <ul className="list card">
        {s.questions.map((q) => {
          const w = works[q.id];
          return (
            <li key={q.id}>
              <a className="list-link" href={href(`/booklet/${s.id}/${q.n}`)}>
                <span className="chip">Q{q.n}</span>
                <span style={{ flex: 1 }}>
                  {q.source}
                  {q.marks ? <span className="muted small"> · {q.marks} marks</span> : null}
                </span>
                {w?.check && <span className={`chip check-${w.check}`}>{CHECK_TEXT[w.check]}</span>}
                <span className={`chip ${w?.done ? 'chip-accent' : ''}`}>{w?.done ? '✓ Done' : w && (w.answer.trim() || hasWorking(w)) ? 'Started' : 'To do'}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ one question

const CHECK_TEXT: Record<Check, string> = { right: 'Right', part: 'Partly right', wrong: 'Not right yet' };

function QuestionPage({ s, q }: { s: BookletSection; q: BookletQuestion }) {
  const b = useBooklets();
  const works = useBookletWork();
  const { settings } = useSettings();
  const [w, setW] = useState<BookletWork | null>(null);
  const [showSol, setShowSol] = useState(false);
  const save = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<BookletWork | null>(null);
  // take the saved record once, then this page owns it (saved as you type, half a second later)
  useEffect(() => {
    if (works && !w) setW(works[q.id] ?? { answer: '', updatedAt: 0 });
  }, [works, w, q.id]);
  // leaving the page saves anything not yet saved
  useEffect(
    () => () => {
      clearTimeout(save.current);
      if (pending.current) void updateBookletWork(q.id, () => pending.current!);
    },
    [q.id],
  );
  if (!w || b.questions === undefined) return <Loading />;
  const change = (p: Partial<BookletWork>, now = false) => {
    const next = { ...w, ...p };
    setW(next);
    clearTimeout(save.current);
    pending.current = next;
    const go = () => {
      pending.current = null;
      void updateBookletWork(q.id, () => next, !now);
    };
    if (now) go();
    else save.current = setTimeout(go, 500);
  };
  const working: Working = w.working ?? emptyWorking(settings.paper, settings.workingMode);
  const prev = s.questions[q.n - 2],
    next = s.questions[q.n];
  return (
    <div className={`stack ${s.year === 2 ? 'year-2' : ''}`}>
      <div>
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href(`/booklet/${s.id}`)}>
            ← {s.ref} {s.title}
          </a>
        </p>
        <h1>
          Question {q.n} <span className="muted small">of {s.questions.length}</span>
        </h1>
        <p className="muted small" style={{ margin: 0 }}>
          {q.source}
          {q.marks ? ` · ${q.marks} marks` : ''} · booklet page {q.page}
        </p>
      </div>
      {b.questions ? (
        <PdfPages doc={b.questions} from={q.page} count={q.pages} label={`Question ${q.n}, page ${q.page} of the booklet`} />
      ) : (
        <p className="card small">
          Load the booklet on this device to see the question: <a href={href('/booklet')}>Mr Astbury’s booklet</a>. You can still write your answer here.
        </p>
      )}
      <section className="card stack" aria-labelledby="ans-h">
        <h2 id="ans-h" className="h3">
          Your answer
        </h2>
        <textarea className="booklet-answer" rows={3} value={w.answer} placeholder="Final answers for each part, e.g. (a) x = 3, (b) 16 − 4√5" aria-labelledby="ans-h" onChange={(e) => change({ answer: e.target.value })} />
        <h3 className="h3" style={{ margin: 0 }}>
          Your working
        </h3>
        <WorkingArea working={working} onChange={(x) => change({ working: x })} exportName={`astbury-${q.id.replace(/[:.]/g, '-')}`} />
        <div className="btn-row">
          <button className={`btn ${w.done ? '' : 'btn-primary'}`} aria-pressed={!!w.done} onClick={() => change({ done: w.done ? undefined : Date.now() }, true)}>
            <Icon name="check" /> {w.done ? `Done ${day(w.done)} (undo)` : 'Mark as done'}
          </button>
          <button className="btn" aria-expanded={showSol} onClick={() => setShowSol((x) => !x)}>
            {showSol ? 'Hide the worked solution' : 'Check against the worked solution'}
          </button>
        </div>
      </section>
      {showSol && (
        <section className="card stack" aria-labelledby="sol-h">
          <h2 id="sol-h" className="h3">
            Worked solution
          </h2>
          {b.solutions ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>
                Question {q.n} starts on this page (look for “Question {q.n}”).
              </p>
              <PdfPages doc={b.solutions} from={q.solPage} count={q.solPages} label={`Worked solution to question ${q.n}`} trim={false} />
            </>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              Load the worked solutions PDF on the <a href={href('/booklet')}>booklet page</a> to see it here.
            </p>
          )}
          <div className="stack" style={{ gap: 6 }}>
            <span className="small">How did you do?</span>
            <div className="btn-row" role="group" aria-label="How did you do?">
              {(Object.keys(CHECK_TEXT) as Check[]).map((c) => (
                <button key={c} className={`btn btn-small why ${w.check === c ? 'on' : ''}`} aria-pressed={w.check === c} onClick={() => change({ check: w.check === c ? undefined : c }, true)}>
                  {CHECK_TEXT[c]}
                </button>
              ))}
            </div>
            {q.marks ? (
              <label className="row small">
                Your mark
                <input type="number" inputMode="numeric" min={0} max={q.marks} value={w.score ?? ''} style={{ width: '5em' }} onChange={(e) => change({ score: e.target.value === '' ? undefined : Math.max(0, Math.min(q.marks!, Math.round(Number(e.target.value)))) }, true)} />
                out of {q.marks}
              </label>
            ) : null}
          </div>
        </section>
      )}
      <div className="btn-row">
        {prev && (
          <a className="btn" href={href(`/booklet/${s.id}/${prev.n}`)}>
            ← Question {prev.n}
          </a>
        )}
        <span className="spacer" />
        {next ? (
          <a className="btn btn-primary" href={href(`/booklet/${s.id}/${next.n}`)}>
            Question {next.n} <Icon name="next" />
          </a>
        ) : (
          <a className="btn btn-primary" href={href(`/booklet/${s.id}`)}>
            Back to the chapter
          </a>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ the record for Mr Astbury

/** Handwritten working as an SVG, scaled to fit. */
function StrokesSvg({ strokes }: { strokes: Stroke[] }) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const s of strokes)
    for (let i = 0; i + 1 < s.points.length; i += 3) {
      x0 = Math.min(x0, s.points[i]);
      x1 = Math.max(x1, s.points[i]);
      y0 = Math.min(y0, s.points[i + 1]);
      y1 = Math.max(y1, s.points[i + 1]);
    }
  if (!Number.isFinite(x0)) return null;
  const pad = 10;
  return (
    <svg className="record-strokes" viewBox={`${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`} role="img" aria-label="Handwritten working">
      {strokes.map((s, k) => {
        let d = '';
        for (let i = 0; i + 1 < s.points.length; i += 3) d += `${i ? 'L' : 'M'}${s.points[i].toFixed(1)} ${s.points[i + 1].toFixed(1)}`;
        return <path key={k} d={d} fill="none" stroke={s.color === 'currentColor' ? '#111' : s.color} strokeOpacity={s.tool === 'highlighter' ? 0.3 : 1} strokeWidth={s.tool === 'highlighter' ? s.size * 4 : s.size} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

function RecordQuestion({ q, w, doc }: { q: BookletQuestion; w?: BookletWork; doc: PDFDocumentProxy | null }) {
  return (
    <article className="record-q">
      <h3>
        Question {q.n} <span className="muted small">· {q.source}</span>
        <span className="record-status">
          {w?.done ? `✓ Done ${day(w.done)}` : 'Not done'}
          {w?.check ? ` · ${CHECK_TEXT[w.check]}` : ''}
          {w?.score !== undefined && q.marks ? ` · ${w.score}/${q.marks}` : ''}
        </span>
      </h3>
      {doc && <PdfPages doc={doc} from={q.page} count={q.pages} label={`Question ${q.n} from the booklet`} />}
      {w?.answer.trim() ? (
        <p className="record-answer">
          <b>Answer:</b> {w.answer}
        </p>
      ) : null}
      {w?.working?.text.trim() ? (
        <div className="record-typed">
          <b>Working:</b>
          <pre>{w.working.text}</pre>
        </div>
      ) : null}
      {w?.working?.strokes.length ? <StrokesSvg strokes={w.working.strokes} /> : null}
    </article>
  );
}

function Record({ query }: { query: URLSearchParams }) {
  const b = useBooklets();
  const works = useBookletWork();
  const [chosen, setChosen] = useState<Set<string> | null>(null);
  const [withQuestions, setWithQuestions] = useState(true);
  const fromQuery = query.get('s')?.split(',').filter((id) => BOOKLET_SECTION.has(id));
  useEffect(() => {
    if (works && !chosen) setChosen(new Set(fromQuery?.length ? fromQuery : BOOKLET.filter((s) => sectionProgress(works, s).done > 0).map((s) => s.id)));
  }, [works, chosen, fromQuery]);
  if (!works || !chosen || b.questions === undefined) return <Loading />;
  const sections = BOOKLET.filter((s) => chosen.has(s.id));
  const name = currentLogin()?.name;
  return (
    <div className="stack booklet-record">
      <div className="no-print stack">
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href('/booklet')}>← Mr Astbury’s booklet</a>
        </p>
        <h1>Record for Mr Astbury</h1>
        <p className="muted" style={{ margin: 0 }}>
          Choose the chapters, then print it or save it as a PDF (in the print window choose “Save as PDF”) and send it to him. It shows each question you’ve done with your answer and working.
        </p>
        <details className="card">
          <summary>
            Chapters to include ({chosen.size} of {BOOKLET.length})
          </summary>
          <ul className="list record-pick">
            {BOOKLET.map((s) => {
              const p = sectionProgress(works, s);
              return (
                <li key={s.id}>
                  <label className="row">
                    <input
                      type="checkbox"
                      checked={chosen.has(s.id)}
                      onChange={(e) => {
                        const n = new Set(chosen);
                        if (e.target.checked) n.add(s.id);
                        else n.delete(s.id);
                        setChosen(n);
                      }}
                    />
                    <span style={{ flex: 1 }}>
                      {s.ref} {s.title}
                    </span>
                    <span className="small muted">
                      {p.done}/{p.total}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </details>
        <label className="row small">
          <input type="checkbox" checked={withQuestions} onChange={(e) => setWithQuestions(e.target.checked)} /> Show each question from the booklet (needs the booklet on this device)
        </label>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => window.print()} disabled={!sections.length}>
            <Icon name="download" /> Print or save as PDF
          </button>
        </div>
      </div>
      <header className="record-head">
        <h2>Mr Astbury’s A Level Exam Qs Series – Pure</h2>
        <p>
          {name ? <b>{name}</b> : null}
          {name ? ' · ' : ''}
          Record made {day(Date.now())} · iolomaths.co.uk
        </p>
        <table className="data record-summary">
          <thead>
            <tr>
              <th scope="col">Chapter</th>
              <th scope="col">Done</th>
              <th scope="col">Finished</th>
              <th scope="col">Marks checked</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => {
              const p = sectionProgress(works, s);
              return (
                <tr key={s.id}>
                  <th scope="row">
                    {s.ref} {s.title}
                  </th>
                  <td>
                    {p.done}/{p.total}
                  </td>
                  <td>{p.complete && p.finishedAt ? day(p.finishedAt) : '–'}</td>
                  <td>{p.of ? `${p.got}/${p.of}` : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </header>
      {sections.map((s) => (
        <section key={s.id} className="record-section">
          <h2>
            {s.ref} {s.title}
          </h2>
          {s.questions
            .filter((q) => works[q.id]?.done || works[q.id]?.answer.trim() || hasWorking(works[q.id]))
            .map((q) => (
              <RecordQuestion key={q.id} q={q} w={works[q.id]} doc={withQuestions ? (b.questions ?? null) : null} />
            ))}
        </section>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ routes

export function Booklet({ parts, query }: { parts: string[]; query: URLSearchParams }) {
  const [a, n] = parts;
  if (!a) return <BookletHome />;
  if (a === 'record') return <Record query={query} />;
  const s = BOOKLET_SECTION.get(a);
  if (!s) return <ErrorBox>That chapter isn’t in the booklet. <a href={href('/booklet')}>Mr Astbury’s booklet</a></ErrorBox>;
  if (!n) return <SectionPage s={s} />;
  const q = s.questions[Number(n) - 1];
  if (!q) {
    navigate(`/booklet/${s.id}`, undefined, true);
    return null;
  }
  return <QuestionPage key={q.id} s={s} q={q} />;
}
