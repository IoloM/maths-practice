import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../lib/settings';
import { downloadBackup, restoreBackup, isPersisted, requestPersistence, getStore } from '../storage';
import { notifyProgress } from '../progress/record';
import { BANK } from '../content/bank';
import { Icon } from '../components/Icon';
import { InstallHelp } from '../components/Install';
import { EXAM_PAPERS, daysUntil } from '../lib/exams';
import { cloudMode, currentLogin } from '../lib/logins';
import { href } from '../router';

export function Settings() {
  const { settings, update } = useSettings();
  const me = currentLogin();
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [storeKind, setStoreKind] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void isPersisted().then(setPersisted);
    void getStore().then(async (s) => {
      setStoreKind(s.kind);
      setLastBackup(await s.getSetting<number | null>('lastBackup', null));
    });
  }, []);
  return (
    <div className="stack">
      <h1>Settings</h1>
      <section className="card stack">
        <h2>Logins</h2>
        {me ? (
          <>
            <p className="small">
              Signed in as <b>{me.name}</b> ({me.username}).{' '}
              {cloudMode ? 'Your progress, history and settings are saved to your login and are the same on every device.' : 'Everything below is for this login only.'}
            </p>
            <div className="btn-row">
              <a className="btn" href={href('/account')}>
                Your login
              </a>
              {cloudMode && (
                <a className="btn" href={href('/group')}>
                  {me.admin ? 'Study group' : 'Set work'}
                </a>
              )}
              {me.admin && (
                <a className="btn btn-primary" href={href('/logins')}>
                  Manage logins
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="small">
              {cloudMode
                ? 'Sign in to keep your progress, history and settings on every device, and to get the work set for you. Logins are made by the person who runs this app.'
                : 'Share this device, or set friends up on theirs: give each person their own login with their own progress, history and settings.'}
            </p>
            <div className="btn-row">
              <a className="btn btn-primary" href={href('/account')}>
                {cloudMode ? 'Sign in' : 'Set up logins'}
              </a>
            </div>
          </>
        )}
      </section>
      <section className="card stack">
        <h2>Your progress</h2>
        <p className="muted small">
          Progress is stored on this device only ({storeKind === 'memory' ? 'temporary memory — this browser blocks storage' : 'IndexedDB'}). Storage is{' '}
          {persisted === true ? <b>persistent</b> : persisted === false ? <b>not yet persistent</b> : 'unknown'}.
          {lastBackup ? ` Last backup: ${new Date(lastBackup).toLocaleString()}.` : ' No backup yet.'}
        </p>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={async () => {
              const name = await downloadBackup();
              setLastBackup(Date.now());
              setMsg(`Saved ${name}`);
            }}
          >
            <Icon name="download" /> Back up progress
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Restore from file
          </button>
          <select aria-label="Restore mode" value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
            <option value="merge">Merge with current progress</option>
            <option value="replace">Replace current progress</option>
          </select>
          {persisted === false && (
            <button className="btn" onClick={async () => setPersisted(await requestPersistence())}>
              Keep data safe on this device
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (!window.confirm('Delete all your progress on this device? This cannot be undone unless you have a backup.')) return;
              await (await getStore()).clearAll();
              notifyProgress();
              setMsg('All progress on this device has been deleted.');
            }}
          >
            Delete all progress…
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="restore-input"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const r = await restoreBackup(f, mode);
              notifyProgress();
              setMsg(`Restored ${r.attempts} attempts.`);
            } catch (err) {
              setMsg((err as Error).message);
            }
            e.target.value = '';
          }}
        />
        {msg && (
          <p role="status" className="small">
            {msg}
          </p>
        )}
      </section>
      <section className="card stack" id="exams">
        <h2>Your exams and goal</h2>
        <label className="row">
          <span style={{ flex: 1 }}>Daily goal (questions a day)</span>
          <input type="number" inputMode="numeric" min={1} max={50} value={settings.dailyGoal} onChange={(e) => update({ dailyGoal: Math.max(1, Math.min(50, Math.round(Number(e.target.value) || 1))) })} style={{ width: '5em' }} />
        </label>
        <p className="muted small">Add your exam dates (from your school's exam timetable) for a countdown on the home page.</p>
        {EXAM_PAPERS.map((p) => {
          const v = settings.examDates[p.id] ?? '';
          const days = v ? daysUntil(v) : null;
          return (
            <label className="row" key={p.id}>
              <span style={{ flex: 1 }}>{p.label}</span>
              <input type="date" value={v} onChange={(e) => update({ examDates: { ...settings.examDates, [p.id]: e.target.value || undefined } })} />
              <span className="muted small" style={{ minWidth: '6.5em' }}>
                {days === null ? '' : days > 0 ? `${days} days to go` : days === 0 ? 'today' : 'done'}
              </span>
            </label>
          );
        })}
      </section>
      <section className="card stack" aria-labelledby="a11y-h">
        <h2 id="a11y-h">Accessibility</h2>
        <fieldset className="row-wrap plain-fieldset">
          <legend className="small muted">Text size</legend>
          {(
            [
              ['normal', 'Normal'],
              ['large', 'Large'],
              ['larger', 'Extra large'],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="row">
              <input type="radio" name="text-size" checked={settings.textSize === v} onChange={() => update({ textSize: v })} />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="row">
          <input type="checkbox" checked={settings.font === 'readable'} onChange={(e) => update({ font: e.target.checked ? 'readable' : 'standard' })} />
          <span>
            Easier-to-read font (Atkinson Hyperlegible: letters that are hard to mix up). Maths keeps its exam-style font.
          </span>
        </label>
        <p className="muted small" style={{ margin: 0 }}>
          Every question has a <b>Read aloud</b> button, which reads the maths the way you’d say it, using your device’s own voices. Text size and font follow you to your other devices when you’re signed in.
        </p>
      </section>
      <section className="card stack">
        <h2>Appearance & input</h2>
        <label className="row">
          Theme
          <select value={settings.theme} onChange={(e) => update({ theme: e.target.value as 'system' | 'light' | 'dark' })}>
            <option value="system">Match device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="row">
          Answer boxes
          <select value={settings.input} onChange={(e) => update({ input: e.target.value as 'maths' | 'plain' })}>
            <option value="maths">Maths keyboard (MathLive)</option>
            <option value="plain">Plain text (type e.g. 3x^2 + sqrt(x))</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.showWorking} onChange={(e) => update({ showWorking: e.target.checked })} />
          Show the working area next to questions
        </label>
        <label className="row">
          Start working in
          <select value={settings.workingMode} onChange={(e) => update({ workingMode: e.target.value as 'write' | 'type' })}>
            <option value="write">Write (handwriting)</option>
            <option value="type">Type</option>
          </select>
        </label>
        <label className="row">
          Paper
          <select value={settings.paper} onChange={(e) => update({ paper: e.target.value as 'plain' | 'lined' | 'squared' })}>
            <option value="plain">Plain</option>
            <option value="lined">Lined</option>
            <option value="squared">Squared</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.pencilOnly} onChange={(e) => update({ pencilOnly: e.target.checked })} />
          <span>
            Pencil only (palm rejection)
            <br />
            <span className="small muted">Only an Apple Pencil or stylus draws; fingers scroll.</span>
          </span>
        </label>
      </section>
      <section className="card stack">
        <h2>Install</h2>
        <InstallHelp />
      </section>
      <section className="card">
        <h2>About</h2>
        <p className="small muted">
          {BANK.totals.templates} question templates · {BANK.totals.questions.toLocaleString()} verified questions · {BANK.totals.fixed} fixed questions. Questions are original and written in the style of Pearson Edexcel 9MA0; this app is not affiliated with Pearson. No tracking, no login.
        </p>
        <p className="small muted">Build {__APP_VERSION__}</p>
      </section>
    </div>
  );
}
