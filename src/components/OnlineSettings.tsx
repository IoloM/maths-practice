/** Settings for the optional server: sync between devices, AI handwriting reading and marking. */
import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings';
import { ApiError, BUILT_IN_API, aiCheck, apiBase, health } from '../lib/api';
import { newSyncCode, normaliseCode, onSyncStatus, startAutoSync, syncNow, syncStatus, type SyncStatus } from '../lib/sync';
import { Icon } from './Icon';

const message = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong');

function SyncPanel() {
  const { settings, update } = useSettings();
  const [status, setStatus] = useState<SyncStatus>(syncStatus);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => onSyncStatus(setStatus), []);
  const base = apiBase(settings);

  const begin = (code: string) => {
    update({ syncCode: code });
    startAutoSync();
    syncNow().catch(() => {});
  };

  if (!base)
    return (
      <p className="muted small">
        Sync needs the app's server, which isn't set up yet. Once it is, your progress follows you between your phone, iPad and laptop.
      </p>
    );

  if (!settings.syncCode)
    return (
      <>
        <p className="small">
          Keep your progress, review cards and mocks the same on all your devices. On your <b>first</b> device press <b>Start syncing</b>; on each other device, type in the code it shows.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => begin(newSyncCode())}>
            <Icon name="refresh" /> Start syncing (new code)
          </button>
        </div>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const code = normaliseCode(typed);
            if (!code) return setError('That isn’t a sync code — it should be 20 letters and numbers, like ABCD-EFGH-JKLM-NPQR-STUV.');
            setError(null);
            setTyped('');
            begin(code);
          }}
        >
          <label className="stack">
            <span className="small">Have a code from another device?</span>
            <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-describedby="sync-code-help" />
          </label>
          <span id="sync-code-help" className="sr-only">
            The 20-character sync code shown on your other device
          </span>
          <div className="btn-row">
            <button className="btn" type="submit" disabled={!typed.trim()}>
              Use this code
            </button>
          </div>
          {error && (
            <p className="small error-text" role="alert">
              {error}
            </p>
          )}
        </form>
      </>
    );

  return (
    <>
      <p className="small">Your sync code — type it into your other devices (Settings → Sync between devices):</p>
      <div className="row">
        <code className="sync-code" aria-label="Sync code">
          {settings.syncCode}
        </code>
        <button
          className="btn btn-small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(settings.syncCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* select-all on the code still works */
            }
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="small muted">
        Your progress is encrypted on this device with this code before it is uploaded, so the server can’t read it. Keep the code private: anyone with it can see your progress. Handwritten working stays on the device you wrote it on; everything else syncs.
      </p>
      <p className="small" role="status">
        {status.state === 'syncing' ? 'Syncing…' : status.state === 'error' ? <span className="error-text">{status.message}</span> : status.message || (status.lastSync ? 'Synced' : 'Not synced yet')}
        {status.lastSync && status.state !== 'syncing' ? ` · last synced ${new Date(status.lastSync).toLocaleString()}` : ''}
      </p>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => syncNow().catch(() => {})} disabled={status.state === 'syncing'}>
          <Icon name="refresh" /> Sync now
        </button>
        <button
          className="btn"
          onClick={() => {
            if (window.confirm('Stop syncing on this device? Your progress stays here and on your other devices; you can type the code in again later.')) update({ syncCode: '' });
          }}
        >
          Stop syncing on this device
        </button>
      </div>
    </>
  );
}

function AiPanel() {
  const { settings, update } = useSettings();
  const [code, setCode] = useState(settings.aiCode);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const base = apiBase(settings);

  return (
    <>
      <p className="small">Three ways to answer in handwriting:</p>
      <ol className="small ai-ways">
        <li>
          <b>Apple Pencil Scribble (iPad, free, works offline).</b> Choose <i>Answer boxes → Plain text</i>, then write straight into any answer box with your Pencil; iPadOS turns it into typed text (e.g. write <code>3x^2</code>, <code>sqrt(x)</code>, <code>pi/4</code>).{' '}
          {settings.input !== 'plain' && (
            <button className="btn btn-small" onClick={() => update({ input: 'plain' })}>
              Use plain text boxes
            </button>
          )}
        </li>
        <li>
          <b>Write it (AI).</b> Press <i>Write it</i> next to an answer box, write the answer as you would on paper, and the AI types it in for you to check.
        </li>
        <li>
          <b>AI: mark my working.</b> After you check an answer, the AI examiner marks your working (handwritten or typed) line by line against the mark scheme and tells you what to fix.
        </li>
      </ol>
      {!base ? (
        <p className="muted small">The AI options need the app's server, which isn't set up yet.</p>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const aiCode = code.trim();
            update({ aiCode });
            if (!aiCode) return setState({ ok: true, text: 'AI features are off on this device.' });
            setBusy(true);
            try {
              await aiCheck({ apiUrl: settings.apiUrl, aiCode });
              setState({ ok: true, text: 'Access code works — the AI options are on.' });
            } catch (err) {
              setState({ ok: false, text: err instanceof ApiError && err.status === 401 ? 'That access code is wrong.' : message(err) });
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="stack">
            <span className="small">AI access code (the one chosen when the server was set up)</span>
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Save and test'}
            </button>
            {settings.aiCode && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCode('');
                  update({ aiCode: '' });
                  setState({ ok: true, text: 'AI features are off on this device.' });
                }}
              >
                Turn AI off
              </button>
            )}
          </div>
          {state && (
            <p className={`small ${state.ok ? '' : 'error-text'}`} role="status">
              {state.text}
            </p>
          )}
          <p className="small muted">Reading an answer costs about 1p and marking working about 3–5p, paid from the Anthropic account on the server, which stops after 200 AI requests a day. Your working is sent to Anthropic’s Claude to be read; nothing else about you is.</p>
        </form>
      )}
    </>
  );
}

function ServerPanel() {
  const { settings, update } = useSettings();
  const [url, setUrl] = useState(settings.apiUrl);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <details>
      <summary className="small">Server address{BUILT_IN_API ? ' (built in — change only if told to)' : ''}</summary>
      <form
        className="stack"
        style={{ marginTop: 8 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const v = url.trim().replace(/\/+$/, '');
          if (v && !/^https:\/\/[^/\s]+|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(v)) return setState({ ok: false, text: 'The address must start with https://' });
          update({ apiUrl: v });
          const base = v || BUILT_IN_API;
          if (!base) return setState({ ok: true, text: 'No server: sync and AI are off.' });
          try {
            const h = await health(base);
            setState({ ok: true, text: `Connected. ${h.ai ? 'AI is set up on the server.' : 'AI is not set up on the server yet.'}` });
          } catch (err) {
            setState({ ok: false, text: message(err) });
          }
        }}
      >
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={BUILT_IN_API || 'https://maths-practice-api.your-name.workers.dev'} aria-label="Server address" autoComplete="off" spellCheck={false} />
        <div className="btn-row">
          <button className="btn" type="submit">
            Save and check
          </button>
        </div>
        {state && (
          <p className={`small ${state.ok ? '' : 'error-text'}`} role="status">
            {state.text}
          </p>
        )}
      </form>
    </details>
  );
}

export function OnlineSettings() {
  return (
    <>
      <section className="card stack">
        <h2>Sync between devices</h2>
        <SyncPanel />
      </section>
      <section className="card stack">
        <h2>Handwriting and AI marking</h2>
        <AiPanel />
        <ServerPanel />
      </section>
    </>
  );
}
