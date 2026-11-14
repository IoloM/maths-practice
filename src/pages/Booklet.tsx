/**
 * `#/booklet`: Mr Astbury's A Level Exam Qs Series (Pure). Signed in, the booklet and its worked
 * solutions come from the site once per device (he gave them for it); otherwise load your own copy.
 * Work through it chapter by chapter in the app: each question shows its pages from the booklet to
 * write your working on (the booklet's own lined paper), a box for each final answer (saved as you
 * go), marks against the worked solution, and for each chapter a PDF of the booklet pages with your
 * working, answers and marks on them to send him (or a printable record of several chapters).
 *
 *   #/booklet                 chapters, progress, and the booklets on this device
 *   #/booklet/<section>       the questions in a chapter
 *   #/booklet/<section>/<n>   one question
 *   #/booklet/record?s=…      the record to print for Mr Astbury
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { BOOKLET, BOOKLET_PAGES, BOOKLET_SECTION, SOLUTIONS_PAGES, type BookletQuestion, type BookletSection } from '../content/astbury';
import { loadBookletFile, removeBookletFile, saveBookletFile, type BookletFile, type StoredFile } from '../lib/booklet-files';
import { fullyMarked, hasWorking, loadBookletWork, recordBookletMarks, sectionProgress, totalMarks, updateBookletWork, useBookletWork, type BookletWork, type BookletWorks, type Check } from '../lib/booklet';
import { useActiveTime } from '../lib/attempt';
import { CHAPTER_BY_REF } from '../content/chapters';
import { openPdf, renderPage } from '../lib/pdf';
import { canDownloadBooklets, downloadBooklet } from '../lib/booklet-cloud';
import { useSettings } from '../lib/settings';
import { currentLogin } from '../lib/logins';
import { href, navigate } from '../router';
import { WorkingArea, emptyWorking } from '../working/WorkingArea';
import { BookletInk, InkedPage } from '../working/BookletInk';
import { loadInkPages } from '../lib/booklet-ink';
import { makeBookletPdf } from '../lib/booklet-pdf';
import { ErrorBox, Loading, plural } from '../components/bits';
import { Icon } from '../components/Icon';
import type { Stroke, Working } from '../storage/types';

const FILE_LABEL: Record<BookletFile, string> = { questions: 'question booklet', solutions: 'worked solutions' };
const EXPECTED: Record<BookletFile, number> = { questions: BOOKLET_PAGES, solutions: SOLUTIONS_PAGES };
const day = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// ------------------------------------------------------------------ the PDFs on this device

const docs: Partial<Record<BookletFile, Promise<PDFDocumentProxy | null>>> = {};
const infoCache: Partial<Record<BookletFile, StoredFile | null>> = {};

/** The booklet on this device; if it isn't here yet and you're signed in, it comes from the site first. */
function openStored(kind: BookletFile): Promise<PDFDocumentProxy | null> {
  docs[kind] ??= (async () => {
    let f = await loadBookletFile(kind);
    if (!f && canDownloadBooklets()) {
      const data = await downloadBooklet(kind);
      if (data) {
        try {
          const doc = await openPdf(data);
          if (doc.numPages === EXPECTED[kind]) {
            f = { kind, name: 'from the site', data, pages: doc.numPages, savedAt: Date.now() };
            await saveBookletFile(f);
          }
        } catch {
          /* not a PDF: leave it to a file the student loads */
        }
      }
    }
    infoCache[kind] = f ?? null;
    return f ? openPdf(f.data) : null;
  })();
  return docs[kind]!;
}

/** While the booklet comes down from the site the first time (it's 26 MB). */
const gettingLabel = () => (canDownloadBooklets() ? 'Getting Mr Astbury’s booklet (just the first time on this device)…' : 'Loading…');

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

// ------------------------------------------------------------------ the PDF for Mr Astbury

type Made = { step: 'idle' } | { step: 'making' } | { step: 'ready'; url: string; file: File } | { step: 'error'; msg: string };

const mb = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);

/**
 * Make the PDF of these chapters: the booklet pages with your writing on them, your answers and
 * marks, and a front page. Then save it (on a computer it downloads straight away) or share it.
 */
function ExportPdf({ sections, label = 'PDF with my working', primary = true }: { sections: BookletSection[]; label?: string; primary?: boolean }) {
  const [made, setMade] = useState<Made>({ step: 'idle' });
  useEffect(
    () => () => {
      if (made.step === 'ready') URL.revokeObjectURL(made.url);
    },
    [made],
  );
  const make = async () => {
    setMade({ step: 'making' });
    try {
      const doc = await openStored('questions');
      const f = await loadBookletFile('questions');
      if (!doc || !f) {
        setMade({ step: 'error', msg: 'The booklet isn’t on this device yet, so its pages can’t go in the PDF. Open Mr Astbury’s booklet (signed in) or choose your copy first.' });
        return;
      }
      const works = await loadBookletWork();
      const { bytes, fileName } = await makeBookletPdf(f.data, sections, works, currentLogin()?.name);
      const file = new File([bytes as BlobPart], fileName, { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      setMade({ step: 'ready', url, file });
      // on a computer it just downloads; on a phone or iPad you choose Save or Share
      if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
      }
    } catch {
      setMade({ step: 'error', msg: 'The PDF couldn’t be made. Try again.' });
    }
  };
  const canShare = made.step === 'ready' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [made.file] });
  return (
    <div className="stack export-pdf" style={{ gap: 6 }}>
      {made.step === 'ready' ? (
        <div className="btn-row">
          <a className="btn btn-primary" href={made.url} download={made.file.name}>
            <Icon name="download" /> Save the PDF
          </a>
          {canShare && (
            <button
              className="btn"
              onClick={() => {
                void navigator.share({ files: [made.file], title: made.file.name.replace(/\.pdf$/, '') }).catch(() => {});
              }}
            >
              <Icon name="share" /> Share
            </button>
          )}
          <button className="btn btn-ghost btn-small" onClick={() => void make()}>
            Make it again
          </button>
        </div>
      ) : (
        <div className="btn-row">
          <button className={`btn ${primary ? 'btn-primary' : ''}`} disabled={made.step === 'making'} onClick={() => void make()}>
            <Icon name="download" /> {made.step === 'making' ? 'Making the PDF…' : label}
          </button>
        </div>
      )}
      <p className="small muted" role="status" style={{ margin: 0 }}>
        {made.step === 'making'
          ? 'Putting your writing onto the booklet pages…'
          : made.step === 'ready'
            ? `Ready: ${made.file.name} (${mb(made.file.size)}).`
            : made.step === 'error'
              ? ''
              : null}
      </p>
      {made.step === 'error' && (
        <p className="small warn-text" role="alert" style={{ margin: 0 }}>
          {made.msg}
        </p>
      )}
    </div>
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
  if (b.questions === undefined || !works) return <Loading label={gettingLabel()} />;
  const ready = !!b.questions;
  const fromSite = infoCache.questions?.name === 'from the site';
  return (
    <div className="stack">
      <div>
        <h1>Mr Astbury’s booklet</h1>
        <p className="muted">
          The A Level Exam Qs Series (Pure), chapter by chapter: write your working on the booklet’s own lined pages, put your final answers in the boxes, and mark them against the worked solution. Then make a PDF of the
          chapter with your working on it to send Mr Astbury.
        </p>
      </div>
      {ready && fromSite ? (
        <details className="card small">
          <summary>The booklet and worked solutions came with your login, and are saved on this device</summary>
          <div className="stack" style={{ gap: 10, marginTop: 10 }}>
            <FilePicker kind="questions" loaded={!!b.questions} onChange={b.reload} />
            <FilePicker kind="solutions" loaded={!!b.solutions} onChange={b.reload} />
          </div>
        </details>
      ) : (
        <section className="card stack" aria-labelledby="files-h">
          <h2 id="files-h" className="h3">
            {ready ? 'The booklets on this device' : 'Load the booklet'}
          </h2>
          {!ready && (
            <p className="small" style={{ margin: 0 }}>
              {canDownloadBooklets()
                ? 'The booklet couldn’t be fetched from the site just now (are you offline?). Try again later, or choose your copy of the PDF.'
                : 'Sign in (Settings → Account) and the booklet comes with your login. Or choose your copy of the PDF (for example from iCloud Drive → School → Maths); it stays on this device.'}
            </p>
          )}
          <FilePicker kind="questions" loaded={!!b.questions} onChange={b.reload} />
          <FilePicker kind="solutions" loaded={!!b.solutions} onChange={b.reload} />
          {b.error && <ErrorBox>{b.error}</ErrorBox>}
        </section>
      )}
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
            Record of this chapter
          </a>
          <a className="btn" href={href('/practice', { c: s.chapter })}>
            Practise this topic in the app
          </a>
        </div>
      </div>
      <section className="card stack" aria-labelledby="pdf-h" style={{ gap: 8 }}>
        <h2 id="pdf-h" className="h3" style={{ margin: 0 }}>
          For Mr Astbury
        </h2>
        <p className="small muted" style={{ margin: 0 }}>
          A PDF of this chapter’s pages from the booklet with your working written on them, your final answers and marks along the bottom of each question, and a front page with the record. Send it to him, or print it.
        </p>
        <ExportPdf sections={[s]} label="PDF of this chapter with my working" />
      </section>
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
                {q.marks && fullyMarked(q, w) ? (
                  <span className={`chip check-${w?.check ?? 'part'}`}>
                    {totalMarks(q, w)}/{q.marks}
                  </span>
                ) : w?.check ? (
                  <span className={`chip check-${w.check}`}>{CHECK_TEXT[w.check]}</span>
                ) : null}
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
  const [marking, setMarking] = useState(false);
  const save = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<BookletWork | null>(null);
  const cur = useRef<BookletWork | null>(null);
  const activeTime = useActiveTime();
  // take the saved record once, then this page owns it (saved as you type, half a second later)
  useEffect(() => {
    if (works && !w) {
      cur.current = works[q.id] ?? { answer: '', updatedAt: 0 };
      setW(cur.current);
    }
  }, [works, w, q.id]);
  // leaving the page saves anything not yet saved
  useEffect(
    () => () => {
      clearTimeout(save.current);
      if (pending.current) void updateBookletWork(q.id, () => pending.current!);
    },
    [q.id],
  );
  if (!w || b.questions === undefined) return <Loading label={gettingLabel()} />;
  const change = (p: Partial<BookletWork>, now = false) => {
    const next = { ...cur.current!, ...p };
    cur.current = next;
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
  const labelled = q.parts.some((p) => p.label !== '');
  const marked = fullyMarked(q, w);
  // marks for every part: record it as an attempt (counted in progress, topics and review), and it's done
  const giveMarks = (marks: Record<string, number>) => {
    change({ marks }, true);
    const now = cur.current!;
    if (!fullyMarked(q, now)) return;
    const total = totalMarks(q, now);
    void recordBookletMarks(s, q, now, Math.round(activeTime())).then((at) => change({ attemptAt: at, done: now.done ?? Date.now(), check: total === q.marks ? 'right' : total === 0 ? 'wrong' : 'part' }, true));
  };
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
        <BookletInk
          doc={b.questions}
          from={q.page}
          count={q.pages}
          name={`Question ${q.n}`}
          onInk={(any) => {
            if (!!cur.current?.inked !== any) change({ inked: any });
          }}
        />
      ) : (
        <p className="card small">
          Load the booklet on this device to see the question and write on its pages: <a href={href('/booklet')}>Mr Astbury’s booklet</a>. You can still write your answer here.
        </p>
      )}
      <section className="card stack" aria-labelledby="ans-h">
        <div>
          <h2 id="ans-h" className="h3" style={{ margin: 0 }}>
            {labelled ? 'Final answers' : 'Final answer'}
          </h2>
          {b.questions && (
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              Work it out on the booklet’s lines above, then put {labelled ? 'each final answer' : 'your final answer'} here.
            </p>
          )}
        </div>
        {labelled ? (
          <div className="stack" style={{ gap: 8 }}>
            {q.parts.map((p) => (
              <label key={p.label} className="row booklet-part">
                <span className="chip">({p.label})</span>
                <input type="text" value={w.answers?.[p.label] ?? ''} placeholder="Final answer" aria-label={`Answer to part (${p.label})`} onChange={(e) => change({ answers: { ...w.answers, [p.label]: e.target.value } })} />
                <span className="muted small">[{p.marks}]</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea className="booklet-answer" rows={2} value={w.answer} placeholder="Your final answer" aria-labelledby="ans-h" onChange={(e) => change({ answer: e.target.value })} />
        )}
        <details className="extra-working" open={!b.questions || !!working.strokes.length || !!working.text.trim()}>
          <summary>{b.questions ? 'Need more room? Extra working space (blank paper, or type it)' : 'Your working'}</summary>
          <WorkingArea working={working} onChange={(x) => change({ working: x })} exportName={`astbury-${q.id.replace(/[:.]/g, '-')}`} />
        </details>
        <div className="btn-row">
          <button className={`btn ${marking ? '' : 'btn-primary'}`} aria-expanded={marking} onClick={() => setMarking((x) => !x)}>
            <Icon name="check" /> {marking ? 'Hide the marking' : marked ? 'Change my marks' : 'Mark my answers'}
          </button>
          <button className="btn" aria-pressed={!!w.done} onClick={() => change({ done: w.done ? undefined : Date.now() }, true)}>
            {w.done ? `Done ${day(w.done)} (undo)` : 'Mark as done without marking'}
          </button>
          {marked && q.marks ? (
            <span className="score-pill" aria-live="polite">
              {totalMarks(q, w)}/{q.marks}
            </span>
          ) : null}
        </div>
      </section>
      {marking && (
        <section className="card stack" aria-labelledby="sol-h">
          <h2 id="sol-h" className="h3">
            Mark it against the worked solution
          </h2>
          {b.solutions ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>
                Question {q.n} starts on this page (look for “Question {q.n}”). Final answers are in the green boxes; the yellow boxes say what the mark scheme insists on.
              </p>
              <PdfPages doc={b.solutions} from={q.solPage} count={q.solPages} label={`Worked solution to question ${q.n}`} trim={false} />
            </>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              Load the worked solutions PDF on the <a href={href('/booklet')}>booklet page</a> to see it here.
            </p>
          )}
          {q.marks ? (
            <div className="stack" style={{ gap: 10 }}>
              <p className="small" style={{ margin: 0 }}>
                Give yourself the marks for each part: the method marks for correct working even if the final answer went wrong, and the accuracy marks only for answers that match.
              </p>
              {q.parts.map((p) => (
                <div key={p.label} className="booklet-mark">
                  <span>
                    {p.label ? <b>({p.label})</b> : <b>Marks</b>}
                    {w.answers?.[p.label] ? <span className="muted small"> · you wrote {w.answers[p.label]}</span> : null}
                  </span>
                  <div className="btn-row" role="group" aria-label={p.label ? `Marks for part (${p.label})` : 'Marks for this question'}>
                    {Array.from({ length: p.marks + 1 }, (_, m) => (
                      <button key={m} className={`btn btn-small why ${w.marks?.[p.label] === m ? 'on' : ''}`} aria-pressed={w.marks?.[p.label] === m} onClick={() => giveMarks({ ...w.marks, [p.label]: m })}>
                        {m}
                      </button>
                    ))}
                    <span className="muted small">/ {p.marks}</span>
                  </div>
                </div>
              ))}
              <div className="btn-row">
                <button className="btn btn-small" onClick={() => giveMarks(Object.fromEntries(q.parts.map((p) => [p.label, p.marks])))}>
                  Full marks
                </button>
                {marked && (
                  <span className="score-pill" aria-live="polite">
                    Total: {totalMarks(q, w)}/{q.marks}
                  </span>
                )}
                {marked && totalMarks(q, w) === q.marks && (
                  <span className="full-marks" role="status">
                    <Icon name="star" /> Full marks!
                  </span>
                )}
              </div>
              {marked && <p className="small muted" style={{ margin: 0 }}>Counted in your progress for {CHAPTER_BY_REF.get(s.chapter as never)?.title ?? s.chapter}, like any other question.</p>}
            </div>
          ) : (
            <div className="stack" style={{ gap: 6 }}>
              <span className="small">This question was adapted, so it has no marks. How did you do?</span>
              <div className="btn-row" role="group" aria-label="How did you do?">
                {(Object.keys(CHECK_TEXT) as Check[]).map((c) => (
                  <button key={c} className={`btn btn-small why ${w.check === c ? 'on' : ''}`} aria-pressed={w.check === c} onClick={() => change({ check: w.check === c ? undefined : c, done: w.done ?? Date.now() }, true)}>
                    {CHECK_TEXT[c]}
                  </button>
                ))}
              </div>
            </div>
          )}
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

function RecordQuestion({ q, w, doc, ink }: { q: BookletQuestion; w?: BookletWork; doc: PDFDocumentProxy | null; ink: Map<number, Stroke[]> }) {
  const pages = Array.from({ length: q.pages }, (_, i) => q.page + i);
  const inked = pages.some((p) => ink.has(p));
  return (
    <article className="record-q">
      <h3>
        Question {q.n} <span className="muted small">· {q.source}</span>
        <span className="record-status">
          {w?.done ? `✓ Done ${day(w.done)}` : 'Not done'}
          {q.marks && fullyMarked(q, w) ? ` · ${totalMarks(q, w)}/${q.marks} marks` : w?.check ? ` · ${CHECK_TEXT[w.check]}` : ''}
        </span>
      </h3>
      {doc && inked ? (
        <div className="booklet-pages">
          {pages.map((p) => (
            <InkedPage key={p} doc={doc} page={p} strokes={ink.get(p) ?? []} label={`Question ${q.n} from the booklet (page ${p}) with the working written on it`} />
          ))}
        </div>
      ) : doc ? (
        <PdfPages doc={doc} from={q.page} count={q.pages} label={`Question ${q.n} from the booklet`} />
      ) : null}
      {w?.answer.trim() ? (
        <p className="record-answer">
          <b>Answer:</b> {w.answer}
        </p>
      ) : null}
      {q.parts.some((p) => p.label && (w?.answers?.[p.label] || w?.marks?.[p.label] !== undefined)) ? (
        <ul className="record-parts">
          {q.parts.map((p) => (
            <li key={p.label}>
              <b>({p.label})</b> {w?.answers?.[p.label] || <span className="muted">no answer written</span>}
              {w?.marks?.[p.label] !== undefined ? (
                <span className="muted">
                  {' '}
                  · {w.marks[p.label]}/{p.marks}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
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
  const [ink, setInk] = useState<Map<number, Stroke[]> | null>(null);
  const fromQuery = query.get('s')?.split(',').filter((id) => BOOKLET_SECTION.has(id));
  const chosenKey = chosen ? [...chosen].sort().join(',') : '';
  useEffect(() => {
    if (!chosenKey) return;
    let alive = true;
    const pages = BOOKLET.filter((s) => chosenKey.split(',').includes(s.id)).flatMap((s) => s.questions.flatMap((q) => Array.from({ length: q.pages }, (_, i) => q.page + i)));
    void loadInkPages(pages).then((m) => alive && setInk(m));
    return () => {
      alive = false;
    };
  }, [chosenKey]);
  useEffect(() => {
    if (works && !chosen) setChosen(new Set(fromQuery?.length ? fromQuery : BOOKLET.filter((s) => sectionProgress(works, s).done > 0).map((s) => s.id)));
  }, [works, chosen, fromQuery]);
  if (!works || !chosen || b.questions === undefined || (chosenKey && !ink)) return <Loading label={gettingLabel()} />;
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
          Choose the chapters, then make the PDF of their booklet pages with your working written on them, your answers and marks (the best thing to send him). Or print this page, a shorter record of each question you’ve done.
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
        {sections.length ? <ExportPdf key={chosenKey} sections={sections} label={sections.length === 1 ? 'PDF of this chapter with my working' : `PDF of these ${sections.length} chapters with my working`} /> : null}
        <div className="btn-row">
          <button className="btn" onClick={() => window.print()} disabled={!sections.length}>
            Print or save this page as a PDF
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
            .filter((q) => works[q.id]?.done || works[q.id]?.answer.trim() || Object.values(works[q.id]?.answers ?? {}).some((a) => a.trim()) || hasWorking(works[q.id]))
            .map((q) => (
              <RecordQuestion key={q.id} q={q} w={works[q.id]} doc={withQuestions ? (b.questions ?? null) : null} ink={ink ?? new Map()} />
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
