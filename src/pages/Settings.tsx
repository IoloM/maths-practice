import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../lib/settings';
import { downloadBackup, restoreBackup, isPersisted, requestPersistence, getStore } from '../storage';
import { notifyProgress } from '../progress/record';
import { BANK } from '../content/bank';
import { Icon } from '../components/Icon';
import { InstallHelp } from '../components/Install';
import { OnlineSettings } from '../components/OnlineSettings';

export function Settings() {
  const { settings, update } = useSettings();
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
        <h2>Your progress</h2>
        <p className="muted small">
          Progress is stored on this device{settings.syncCode ? ' and synced (encrypted) to your other devices' : ' only'} ({storeKind === 'memory' ? 'temporary memory — this browser blocks storage' : 'IndexedDB'}). Storage is{' '}
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
      <OnlineSettings />
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
