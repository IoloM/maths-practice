/** Sign in, choose your own password, see where your progress is saved, sign out. */
import { useEffect, useState, type FormEvent } from 'react';
import { href } from '../router';
import { apiBase } from '../lib/api';
import { MIN_PASSWORD, changePassword, onAccountChange, readAccount, signIn, signOut } from '../lib/account';
import { onSyncStatus, startAutoSync, syncNow, syncStatus, type SyncStatus } from '../lib/sync';
import { Icon } from '../components/Icon';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function useAccount() {
  const [account, setAccount] = useState(readAccount);
  useEffect(() => onAccountChange(() => setAccount(readAccount())), []);
  return account;
}

function SignInForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
      startAutoSync();
      syncNow().catch(() => {});
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <h2>Sign in</h2>
      <p className="small muted">Logins are made by the person who runs this app — ask them for one. Signed in, your progress, history and settings are saved to your account and follow you to any device.</p>
      <label className="stack">
        <span className="small">Username</span>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
      </label>
      <label className="stack">
        <span className="small">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={busy || !username.trim() || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
      {error && (
        <p className="small error-text" role="alert">
          {error}
        </p>
      )}
      <p className="small muted">Anything you've already done on this device is added to your account when you sign in.</p>
    </form>
  );
}

function PasswordForm({ first }: { first: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < MIN_PASSWORD) return setState({ ok: false, text: `Use at least ${MIN_PASSWORD} characters.` });
    if (next !== again) return setState({ ok: false, text: 'The two new passwords are different.' });
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setAgain('');
      setState({ ok: true, text: 'Password changed. Your other devices have been signed out.' });
    } catch (err) {
      setState({ ok: false, text: message(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      {first && <p className="small">You signed in with a temporary password. Choose your own now — only you will know it.</p>}
      <input type="text" autoComplete="username" value={readAccount()?.user.username ?? ''} readOnly hidden />
      <label className="stack">
        <span className="small">{first ? 'Temporary password' : 'Current password'}</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="stack">
        <span className="small">New password ({MIN_PASSWORD}+ characters)</span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
      </label>
      <label className="stack">
        <span className="small">New password again</span>
        <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required />
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : first ? 'Set my password' : 'Change password'}
        </button>
      </div>
      {state && (
        <p className={`small ${state.ok ? '' : 'error-text'}`} role="status">
          {state.text}
        </p>
      )}
    </form>
  );
}

function SignedIn() {
  const account = useAccount()!;
  const [status, setStatus] = useState<SyncStatus>(syncStatus);
  const [busy, setBusy] = useState(false);
  useEffect(() => onSyncStatus(setStatus), []);
  const { user } = account;

  const out = async () => {
    setBusy(true);
    let saved = true;
    try {
      await syncNow();
    } catch {
      saved = false;
    }
    const ok = window.confirm(
      saved
        ? 'Sign out? Your progress is saved to your account and will be removed from this device.'
        : 'Your latest progress could NOT be saved to your account (are you offline?). Signing out now removes it from this device. Sign out anyway?',
    );
    if (ok) await signOut();
    setBusy(false);
  };

  return (
    <>
      <section className="card stack">
        <h2>
          Signed in as {user.name} <span className="muted small">({user.username})</span>
        </h2>
        {user.mustChange ? (
          <PasswordForm first />
        ) : (
          <>
            <p className="small" role="status">
              {status.state === 'syncing' ? 'Saving…' : status.state === 'error' ? <span className="error-text">{status.message}</span> : status.message || 'Your progress, history and settings are saved to your account.'}
              {status.lastSync && status.state !== 'syncing' ? ` · last saved ${new Date(status.lastSync).toLocaleString()}` : ''}
            </p>
            <div className="btn-row">
              <button className="btn" onClick={() => syncNow().catch(() => {})} disabled={status.state === 'syncing'}>
                <Icon name="refresh" /> Save now
              </button>
              {user.admin && (
                <a className="btn btn-primary" href={href('/admin')}>
                  Manage logins
                </a>
              )}
              <button className="btn" onClick={out} disabled={busy}>
                {busy ? 'Saving…' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </section>
      {!user.mustChange && (
        <section className="card stack">
          <details>
            <summary>Change password</summary>
            <PasswordForm first={false} />
          </details>
        </section>
      )}
    </>
  );
}

export function Account() {
  const account = useAccount();
  return (
    <div className="stack">
      <h1>Your account</h1>
      {!apiBase() ? (
        <p className="card muted">Logins aren't set up on this copy of the app yet. Everything still works — your progress is kept on this device.</p>
      ) : account ? (
        <SignedIn />
      ) : (
        <SignInForm />
      )}
    </div>
  );
}
