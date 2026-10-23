/** Settings for the optional server (logins, sync between devices, built-in AI) and the free ways to answer by hand and get AI marking. */
import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings';
import { ApiError, BUILT_IN_API, aiCheck, apiBase, health } from '../lib/api';
import { newSyncCode, normaliseCode, onSyncStatus, startAutoSync, syncNow, syncStatus, type SyncStatus } from '../lib/sync';
import { readAccount, onAccountChange } from '../lib/account';
import { href } from '../router';
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
          No login? You can still keep your devices in step: on your <b>first</b> device press <b>Start syncing</b>; on each other device, type in the code it shows.
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

function AccountPanel() {
  const [account, setAccount] = useState(readAccount);
  useEffect(() => onAccountChange(() => setAccount(readAccount())), []);
  const { settings } = useSettings();
  if (!apiBase(settings)) return <SyncPanel />;
  if (account)
    return (
      <>
        <p className="small">
          Signed in as <b>{account.user.name}</b> ({account.user.username}). Your progress, history and settings are saved to your account and follow you to any device.
        </p>
        <div className="btn-row">
          <a className="btn" href={href('/account')}>
            Account
          </a>
          {account.user.admin && (
            <a className="btn" href={href('/admin')}>
              Manage logins
            </a>
          )}
        </div>
      </>
    );
  return (
    <>
      <p className="small">Sign in to keep your progress, history and settings with you on any device. Logins are made by the person who runs this app.</p>
      <div className="btn-row">
        <a className="btn btn-primary" href={href('/account')}>
          Sign in
        </a>
      </div>
      <details>
        <summary className="small">No login? Sync your own devices with a code</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          <SyncPanel />
        </div>
      </details>
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
      <p className="small">Free ways to answer by hand and get your work marked:</p>
      <ol className="small ai-ways">
        <li>
          <b>Write straight into answer boxes.</b> On iPad, choose <i>Answer boxes → Plain text</i> and write with your Apple Pencil — Scribble turns it into typed text (e.g. write <code>3x^2</code>, <code>sqrt(x)</code>, <code>pi/4</code>). Windows pens and Android handwriting keyboards work the same way. Free, and works offline.{' '}
          {settings.input !== 'plain' && (
            <button className="btn btn-small" onClick={() => update({ input: 'plain' })}>
              Use plain text boxes
            </button>
          )}
        </li>
        <li>
          <b>Ask your AI app to mark it.</b> After you check an answer, press <i>Ask your AI app</i>: your working (as a picture), the question and the mark scheme go to Claude, ChatGPT or Gemini on your own account, which marks it line by line like an examiner. Nothing to set up and nothing for this app to pay.
        </li>
      </ol>
      <details>
        <summary className="small">Built-in AI (optional — needs a paid Anthropic API key on the server)</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          <p className="small muted">
            With a key on the server, two more buttons appear: <i>Write it</i> (the AI reads a handwritten answer into the box) and <i>AI: mark my working</i> (marked inside the app, with ticks you can keep).
          </p>
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
        </div>
      </details>
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
        <h2>Your account</h2>
        <AccountPanel />
      </section>
      <section className="card stack">
        <h2>Handwriting and AI marking</h2>
        <AiPanel />
        <ServerPanel />
      </section>
    </>
  );
}
