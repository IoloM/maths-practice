/**
 * Online logins (cloud.ts): signing in on any device, your login (#/account), and the admin's page
 * for making and managing logins (#/logins).
 */
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { href, shareUrl } from '../router';
import { PAPER_TITLES, PAST_PAPER_BY_ID } from '../content/past-papers';
import {
  MIN_PASSWORD,
  activities,
  USERNAME,
  claimLogin,
  cloudMe,
  createLogin,
  deleteLogin,
  group,
  loginStatus,
  recentPeople,
  resetLogin,
  setLoginAdmin,
  setLoginDisabled,
  setPassword,
  signIn,
  signOut,
  INVITE_DAYS,
  createInvite,
  inviteOpen,
  inviteStatus,
  inviteUrl,
  joinWithInvite,
  listInvites,
  stopInvite,
  type ActivitySummary,
  type Invite,
  type Me,
  type Member,
} from '../lib/cloud';
import { deviceLogins, chooseGuest } from '../lib/logins';
import { onSyncStatus, startAutoSync, syncNow, syncStatus, type SyncStatus } from '../lib/sync';
import { ErrorBox, Loading, TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

const QrCode = lazy(() => import('../components/QrCode'));
/** A personal sign-in link: the username is filled in, so they go straight to choosing a password. */
export const signInLink = (username: string) => shareUrl(`/account?u=${encodeURIComponent(username)}`);
/** The username in a personal sign-in link, if this page was opened from one. */
const linkedUsername = () => {
  const u = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('u')?.trim().toLowerCase() ?? '';
  return USERNAME.test(u) ? u : '';
};

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
/** Everything (progress, settings, theme) belongs to the login, so start the app afresh. */
const restart = (path = '/') => {
  // one reload, straight to the new page: setting location.hash first would render it once and could
  // race the reload in Safari
  history.replaceState(null, '', `#${path}`);
  window.location.reload();
};
const suggestUsername = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 32);
const when = (t: number | string | null | undefined) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—');

/**
 * Who is signed in, as of when the page opened. Signing in or out always restarts the app, so pages
 * don't switch mid-way (a sign-in form must stay put while it asks for a password).
 */
export function useCloudMe(): Me | null {
  const [m] = useState(cloudMe);
  return m;
}

function Problem({ text }: { text: string | null }) {
  return text ? (
    <p className="small error-text" role="alert">
      {text}
    </p>
  ) : null;
}

function NewPassword({ value, again, onValue, onAgain }: { value: string; again: string; onValue: (v: string) => void; onAgain: (v: string) => void }) {
  return (
    <>
      <label className="stack">
        <span className="small">New password ({MIN_PASSWORD}+ characters)</span>
        <input type="password" value={value} onChange={(e) => onValue(e.target.value)} autoComplete="new-password" required />
      </label>
      <label className="stack">
        <span className="small">New password again</span>
        <input type="password" value={again} onChange={(e) => onAgain(e.target.value)} autoComplete="new-password" required />
      </label>
    </>
  );
}
const pairProblem = (a: string, b: string) => (a.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : a !== b ? 'The two passwords are different.' : null);

// ---------------------------------------------------------------- signing in
/**
 * The sign-in form, on its own page or as the whole screen on a device that needs a login. Username
 * first: a login that is new (or was reset) chooses its password here; otherwise, the password.
 */
export function CloudSignIn({ screen = false }: { screen?: boolean }) {
  const recent = recentPeople();
  const [linked] = useState(linkedUsername);
  const [username, setUsername] = useState(linked || (recent.length === 1 ? recent[0].username : ''));
  const [password, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [step, setStep] = useState<'username' | 'password' | 'choose'>('username');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const old = deviceLogins();

  const finish = async (m: Me) => {
    const { adoptLocalProgress } = await import('../lib/adopt');
    await adoptLocalProgress(m).catch(() => 0);
    restart(screen ? window.location.hash.replace(/^#/, '') || '/' : '/');
  };
  /** New login → choose a password; otherwise ask for it. */
  const check = async (name: string) => {
    setProblem(null);
    if (!USERNAME.test(name.trim().toLowerCase())) return setProblem('Type your username (lower-case letters and numbers).');
    setBusy(true);
    try {
      const status = await loginStatus(name);
      if (status === 'none') setProblem('There’s no login with that username — check it with whoever runs the app.');
      else if (status === 'off') setProblem('This login has been switched off — ask whoever runs the app.');
      else setStep(status === 'new' ? 'choose' : 'password');
    } catch {
      setStep('password'); // can't check (offline?): just try signing in
    } finally {
      setBusy(false);
    }
  };
  // opened from a personal sign-in link: go straight to the password
  useEffect(() => {
    if (linked) void check(linked);
  }, [linked]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 'username') return void check(username);
    setProblem(null);
    if (step === 'choose') {
      const p = pairProblem(password, again);
      if (p) return setProblem(p);
    }
    setBusy(true);
    try {
      await finish(step === 'choose' ? await claimLogin(username, password) : await signIn(username, password));
    } catch (err) {
      setProblem(message(err));
    } finally {
      setBusy(false);
    }
  };
  const back = () => {
    setStep('username');
    setPw('');
    setAgain('');
    setProblem(null);
  };

  return (
    <form className={`stack ${screen ? 'signin' : 'card'}`} onSubmit={submit}>
      <h2 className={screen ? 'h1' : undefined}>{step === 'choose' ? 'Choose your password' : 'Sign in'}</h2>
      {step === 'username' ? (
        <>
          {screen && old.length > 0 && <p className="small">Logins now work on every device. Sign in with your username — what you practised on this device comes with you.</p>}
          {recent.length > 1 && (
            <div className="who-list" role="group" aria-label="People who have signed in here">
              {recent.map((p) => (
                <button
                  type="button"
                  key={p.username}
                  className="btn who"
                  onClick={() => {
                    setUsername(p.username);
                    void check(p.username);
                  }}
                >
                  <span className="who-initial" aria-hidden="true">
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <label className="stack">
            <span className="small">Username</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus={!screen} />
          </label>
        </>
      ) : (
        <>
          <p className="small">
            <b>{username.trim().toLowerCase()}</b>{' '}
            <button type="button" className="btn btn-small btn-ghost" onClick={back}>
              Not you?
            </button>
          </p>
          <input type="text" value={username} autoComplete="username" readOnly hidden />
          {step === 'password' ? (
            <label className="stack">
              <span className="small">Password</span>
              <input type="password" value={password} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required autoFocus />
            </label>
          ) : (
            <>
              <p className="small">Welcome! This is your first time signing in, so choose your own password. Only you will know it, and it works on every device.</p>
              <NewPassword value={password} again={again} onValue={setPw} onAgain={setAgain} />
            </>
          )}
        </>
      )}
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'One moment…' : step === 'username' ? 'Continue' : step === 'password' ? 'Sign in' : 'Set my password and sign in'}
        </button>
      </div>
      <Problem text={problem} />
      {step !== 'choose' && <p className="muted small">Logins are made by the person who runs this app. Forgotten your password? Ask them to reset it, then sign in and choose a new one.</p>}
      {screen && step === 'username' && (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              chooseGuest();
              restart(window.location.hash.replace(/^#/, '') || '/');
            }}
          >
            Use without an account (nothing is saved)
          </button>
        </div>
      )}
    </form>
  );
}

/** Signed in here when an admin reset the password: choose a new one to carry on. */
export function ChoosePasswordScreen() {
  const m = cloudMe()!;
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <form
      className="stack signin"
      onSubmit={async (e) => {
        e.preventDefault();
        const p = pairProblem(next, again);
        if (p) return setProblem(p);
        try {
          await claimLogin(m.username, next);
          restart('/');
        } catch (err) {
          setProblem(message(err));
        }
      }}
    >
      <h1>Choose your password, {m.name}</h1>
      <p className="small">Your password was reset. Choose a new one to carry on.</p>
      <input type="text" value={m.username} autoComplete="username" readOnly hidden />
      <NewPassword value={next} again={again} onValue={setNext} onAgain={setAgain} />
      <div className="btn-row">
        <button className="btn btn-primary" type="submit">
          Set my password
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await signOut();
            restart('/');
          }}
        >
          Sign out
        </button>
      </div>
      <Problem text={problem} />
    </form>
  );
}

// ---------------------------------------------------------------- your login (#/account)
function SyncLine() {
  const [s, setS] = useState<SyncStatus>(syncStatus);
  useEffect(() => onSyncStatus(setS), []);
  return (
    <p className="small" role="status">
      {s.state === 'syncing' ? 'Saving…' : s.state === 'error' ? <span className="error-text">{s.message}</span> : s.message || 'Your progress, history and settings are saved to your login.'}
      {s.lastSync && s.state !== 'syncing' ? ` · last saved ${new Date(s.lastSync).toLocaleString()}` : ''}
    </p>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const p = pairProblem(next, again);
        if (p) return setState({ ok: false, text: p });
        try {
          await setPassword(current, next);
          setCurrent('');
          setNext('');
          setAgain('');
          setState({ ok: true, text: 'Password changed.' });
        } catch (err) {
          setState({ ok: false, text: message(err) });
        }
      }}
    >
      <input type="text" value={cloudMe()?.username ?? ''} autoComplete="username" readOnly hidden />
      <label className="stack">
        <span className="small">Current password</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <NewPassword value={next} again={again} onValue={setNext} onAgain={setAgain} />
      <div className="btn-row">
        <button className="btn btn-primary" type="submit">
          Change password
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

export function CloudAccount() {
  const m = useCloudMe();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (m) startAutoSync();
  }, [m]);
  if (!m)
    return (
      <div className="stack">
        <h1>Your login</h1>
        <CloudSignIn />
        <p className="muted small">No login? You can still practise without one, but nothing is saved.</p>
      </div>
    );
  const out = async () => {
    setBusy(true);
    let saved = true;
    try {
      await syncNow();
    } catch {
      saved = false;
    }
    if (saved || window.confirm('Your latest progress couldn’t be saved online (are you offline?). It stays on this device until you sign in here again. Sign out anyway?')) {
      if (saved) {
        // it's all saved online: don't leave a copy for the next person on this device
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(`maths-practice-c-${m.id}`);
          req.onsuccess = req.onerror = req.onblocked = () => resolve();
        });
      }
      await signOut();
      restart('/');
    }
    setBusy(false);
  };
  return (
    <div className="stack">
      <h1>Your login</h1>
      <section className="card stack">
        <h2>
          {m.name} <span className="muted small">({m.username})</span>
        </h2>
        <SyncLine />
        <div className="btn-row">
          <button className="btn" onClick={() => syncNow().catch(() => {})}>
            <Icon name="refresh" /> Save now
          </button>
          <a className="btn" href={href('/group')}>
            {m.admin ? 'Study group' : 'Set work'}
          </a>
          {m.admin && (
            <a className="btn btn-primary" href={href('/logins')}>
              Manage logins
            </a>
          )}
          <button className="btn" onClick={out} disabled={busy}>
            {busy ? 'Saving…' : 'Sign out'}
          </button>
        </div>
        <p className="muted small">Sign in with the same username on your phone, tablet or computer: your progress, history and settings are the same everywhere.</p>
      </section>
      <section className="card stack">
        <details>
          <summary>Change password</summary>
          <ChangePassword />
        </details>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- managing logins (#/logins)
/** What to tell someone so they can sign in for the first time (they choose their own password). */
function Slip({ name, username, reset, onDone }: { name: string; username: string; reset?: boolean; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = slipText(name, username, reset);
  return (
    <div className="panel" role="status">
      <div className="panel-title">{reset ? `${name} chooses a new password next time they sign in` : `Login ready for ${name}`}</div>
      <div className="panel-body stack">
        <pre className="login-slip">{text}</pre>
        <p className="small muted">They choose their own password the first time they sign in. Until then the login shows “hasn’t set a password yet” here.</p>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (await sendText(text, 'Maths Practice login')) setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Send or copy details'}
          </button>
          <button className="btn btn-ghost" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

type SlipInfo = { name: string; username: string; reset?: boolean };

/** The message to send someone with their new (or reset) login: a link with their username already in. */
const slipText = (name: string, username: string, reset?: boolean) =>
  `${reset ? `Your Maths Practice password has been reset, ${name}.` : `Hi ${name}, here's your Maths Practice login.`}\nOpen this link, then choose your own password.\n${signInLink(username)}\nYour username is ${username}. It works on any phone, tablet or computer.`;

/** Send or copy a message (the phone's share sheet where there is one). */
async function sendText(text: string, title: string): Promise<boolean> {
  try {
    if (navigator.share) await navigator.share({ title, text });
    else await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // cancelled
  }
}

/** Usernames for a list of names: first names, made unique against existing logins and each other. */
export function usernamesFor(names: string[], taken: string[]): string[] {
  const used = new Set(taken);
  return names.map((n) => {
    const first = suggestUsername(n.split(/\s+/)[0] ?? n) || suggestUsername(n) || 'user';
    const full = suggestUsername(n);
    let u = !used.has(first) ? first : !used.has(full) && full ? full : '';
    for (let k = 2; !u; k++) if (!used.has(`${first}${k}`)) u = `${first}${k}`;
    used.add(u);
    return u.slice(0, 32);
  });
}

/** Several logins at once: one name per line. */
function AddMany({ taken, onAdded, onClose }: { taken: string[]; onAdded: () => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<SlipInfo[] | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const names = [...new Set(text.split('\n').map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean))].slice(0, 50);
  const usernames = usernamesFor(names, taken);
  if (made) {
    const all = made.map((m) => slipText(m.name, m.username)).join('\n\n');
    return (
      <div className="panel" role="status">
        <div className="panel-title">
          {made.length} login{made.length === 1 ? '' : 's'} ready
        </div>
        <div className="panel-body stack">
          {failed.length > 0 && <p className="error-text small">Couldn’t make: {failed.join('; ')}</p>}
          <ul className="list small">
            {made.map((m) => (
              <li key={m.username} className="row-wrap work-line">
                <span style={{ flex: 1 }}>
                  <b>{m.name}</b> · {m.username}
                </span>
                <button className="btn btn-small" onClick={() => void sendText(slipText(m.name, m.username), 'Maths Practice login')}>
                  Send to {m.name.split(' ')[0]}
                </button>
              </li>
            ))}
          </ul>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => void navigator.clipboard.writeText(all).then(() => setCopied(true))}>
              {copied ? 'Copied' : 'Copy all the messages'}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="stack">
      <label className="stack">
        <span className="small">Names, one per line</span>
        <textarea className="mistake-note" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Ana Jones\nBen Smith\nCal Patel'} />
      </label>
      {names.length > 0 && (
        <p className="small" style={{ margin: 0 }}>
          Usernames: {names.map((n, i) => `${n} → ${usernames[i]}`).join(' · ')}
        </p>
      )}
      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={busy || !names.length}
          onClick={async () => {
            setBusy(true);
            const ok: SlipInfo[] = [];
            const bad: string[] = [];
            for (let i = 0; i < names.length; i++) {
              try {
                await createLogin({ username: usernames[i], name: names[i], admin: false });
                ok.push({ name: names[i], username: usernames[i] });
              } catch (e) {
                bad.push(`${names[i]} (${message(e)})`);
              }
            }
            setFailed(bad);
            setMade(ok);
            setBusy(false);
            onAdded();
          }}
        >
          {busy ? 'Making logins…' : `Make ${names.length || ''} login${names.length === 1 ? '' : 's'}`}
        </button>
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const dayText = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function InviteCard({ inv, onChange }: { inv: Invite; onChange: () => void }) {
  const [qr, setQr] = useState(false);
  const [sent, setSent] = useState(false);
  const url = inviteUrl(inv.code);
  const open = inviteOpen(inv);
  const left = inv.max_uses - inv.uses;
  const text = `Join me on Maths Practice (A level maths practice that saves your progress on every device). Make your own login here: ${url}`;
  return (
    <li className={`invite ${open ? '' : 'closed'}`}>
      <code className="invite-url">{url}</code>
      <div className="small muted">
        {inv.uses} of {inv.max_uses} used ·{' '}
        {open ? `${left} place${left === 1 ? '' : 's'} left, until ${dayText(inv.expires_at)}` : !inv.active ? 'stopped' : inv.uses >= inv.max_uses ? 'all used' : 'ran out'}
      </div>
      {open && (
        <div className="btn-row">
          <button className="btn btn-small btn-primary" onClick={() => void sendText(text, 'Join Maths Practice').then((ok) => ok && setSent(true))}>
            {sent ? 'Sent' : 'Send or copy the link'}
          </button>
          <button className="btn btn-small" aria-expanded={qr} onClick={() => setQr(!qr)}>
            {qr ? 'Hide QR code' : 'Show QR code'}
          </button>
          <button className="btn btn-small btn-ghost" onClick={() => window.confirm('Stop this invite link? Nobody else can join with it.') && void stopInvite(inv.code).then(onChange)}>
            Stop it
          </button>
        </div>
      )}
      {open && qr && (
        <Suspense fallback={null}>
          <div className="invite-qr">
            <QrCode text={url} label="QR code for the invite link" />
            <span className="small muted">Point a phone camera at it to open the link.</span>
          </div>
        </Suspense>
      )}
    </li>
  );
}

/** Invite links: the easiest way to add people. */
function InvitePanel() {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [days, setDays] = useState(7);
  const [uses, setUses] = useState(10);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const load = () =>
    listInvites()
      .then(setInvites)
      .catch((e) => setProblem(message(e)));
  useEffect(() => {
    void load();
  }, []);
  const open = (invites ?? []).filter((i) => inviteOpen(i));
  const old = (invites ?? []).filter((i) => !inviteOpen(i));
  return (
    <section className="card stack" aria-labelledby="invite-h">
      <h2 id="invite-h">Invite people</h2>
      <p className="small muted" style={{ margin: 0 }}>
        The quickest way to add people: send a link (or show the QR code). Each person who opens it makes their own login — their name, a username and a password. You choose how many people and how long it lasts, and can stop it any time. Logins made this way are never admins.
      </p>
      <div className="row-wrap">
        <label className="row">
          For up to
          <select value={uses} onChange={(e) => setUses(Number(e.target.value))}>
            {[1, 5, 10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'person' : 'people'}
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          for
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {INVITE_DAYS.map((d) => (
              <option key={d} value={d}>
                {d === 1 ? '1 day' : `${d} days`}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setProblem(null);
            try {
              await createInvite(days, uses);
              await load();
            } catch (e) {
              setProblem(message(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Icon name="users" /> Make an invite link
        </button>
      </div>
      <Problem text={problem} />
      {open.length > 0 && (
        <ul className="stack invite-list">
          {open.map((i) => (
            <InviteCard key={i.code} inv={i} onChange={() => void load()} />
          ))}
        </ul>
      )}
      {old.length > 0 && (
        <details>
          <summary className="small">Old links ({old.length})</summary>
          <ul className="stack invite-list">
            {old.map((i) => (
              <InviteCard key={i.code} inv={i} onChange={() => void load()} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** `#/invite/<code>`: make your own login with an invite link. */
export function InviteJoin({ code }: { code: string }) {
  const me = cloudMe();
  const [state, setState] = useState<'checking' | 'open' | 'closed' | 'none' | 'offline'>('checking');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [password, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    inviteStatus(code)
      .then((r) => setState(r.status))
      .catch(() => setState('offline'));
  }, [code]);
  const u = touched ? username : suggestUsername(name);
  if (me)
    return (
      <div className="stack">
        <h1>Join Maths Practice</h1>
        <p>
          You’re already signed in as <b>{me.name}</b>. This link is for making a new login — <a href={href('/account')}>sign out</a> first if you want to make one for someone else.
        </p>
      </div>
    );
  if (state === 'checking') return <Loading />;
  if (state !== 'open')
    return (
      <div className="stack">
        <h1>Join Maths Practice</h1>
        <ErrorBox>
          {state === 'closed'
            ? 'This invite link has run out (or been stopped). Ask whoever sent it for a new one.'
            : state === 'none'
              ? 'This invite link isn’t right — check you copied all of it, or ask for a new one.'
              : 'Can’t check the invite link — are you online? Try again in a moment.'}
        </ErrorBox>
      </div>
    );
  return (
    <form
      className="stack card signin"
      onSubmit={async (e) => {
        e.preventDefault();
        setProblem(null);
        if (!name.trim()) return setProblem('Type your name.');
        if (!USERNAME.test(u)) return setProblem('Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
        const p = pairProblem(password, again);
        if (p) return setProblem(p);
        setBusy(true);
        try {
          const m = await joinWithInvite(code, { name, username: u, password });
          const { adoptLocalProgress } = await import('../lib/adopt');
          await adoptLocalProgress(m).catch(() => 0);
          restart('/');
        } catch (err) {
          setProblem(message(err));
          setBusy(false);
        }
      }}
    >
      <h1 className="h1">Join Maths Practice</h1>
      <p className="small" style={{ margin: 0 }}>
        Make your own login: your progress, history and settings are saved to it and follow you to any phone, tablet or computer.
      </p>
      <label className="stack">
        <span className="small">Your name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} required />
      </label>
      <label className="stack">
        <span className="small">Choose a username (you’ll sign in with it)</span>
        <input
          type="text"
          value={u}
          onChange={(e) => {
            setTouched(true);
            setUsername(e.target.value.toLowerCase());
          }}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>
      <NewPassword value={password} again={again} onValue={setPw} onAgain={setAgain} />
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Making your login…' : 'Make my login'}
        </button>
      </div>
      <Problem text={problem} />
    </form>
  );
}

function AddLogin({ onAdded, taken }: { onAdded: () => void; taken: string[] }) {
  const [many, setMany] = useState(false);
  if (many) return <AddMany taken={taken} onAdded={onAdded} onClose={() => setMany(false)} />;
  return <AddOne onAdded={onAdded} onMany={() => setMany(true)} />;
}

function AddOne({ onAdded, onMany }: { onAdded: () => void; onMany: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [slip, setSlip] = useState<SlipInfo | null>(null);
  const u = touched ? username : suggestUsername(name);
  if (slip) return <Slip {...slip} onDone={() => setSlip(null)} />;
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setProblem(null);
        if (!USERNAME.test(u)) return setProblem('Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
        setBusy(true);
        try {
          await createLogin({ username: u, name: name.trim(), admin });
          setSlip({ name: name.trim(), username: u });
          setName('');
          setUsername('');
          setTouched(false);
          setAdmin(false);
          onAdded();
        } catch (err) {
          setProblem(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="row-wrap">
        <label className="stack grow">
          <span className="small">Their name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={60} required />
        </label>
        <label className="stack grow">
          <span className="small">Username</span>
          <input
            type="text"
            value={u}
            onChange={(e) => {
              setTouched(true);
              setUsername(e.target.value.toLowerCase());
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
        <span>Admin (can make and manage logins and set work)</span>
      </label>
      <div className="btn-row">
        <button className="btn btn-ghost" type="button" onClick={onMany}>
          Add several at once
        </button>
        <button className="btn btn-primary" type="submit" disabled={busy || !name.trim() || !u}>
          {busy ? 'Making login…' : 'Make login'}
        </button>
      </div>
      <Problem text={problem} />
    </form>
  );
}

function Row({ u, me, work, onChange }: { u: Member; me: Me; work?: ActivitySummary; onChange: () => void }) {
  const [slip, setSlip] = useState<SlipInfo | null>(null);
  const [viewing, setViewing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const act = async (f: () => Promise<unknown>) => {
    setProblem(null);
    setBusy(true);
    try {
      await f();
      onChange();
    } catch (err) {
      setProblem(message(err));
    } finally {
      setBusy(false);
    }
  };
  const s = u.summary;
  return (
    <>
      <tr className={u.disabled ? 'muted' : ''}>
        <td>
          <b>{u.name}</b>
          {u.id === me.id && <span className="muted small"> (you)</span>}
          <br />
          <span className="small muted">
            {u.username}
            {u.admin ? ' · admin' : ''}
            {u.disabled ? ' · switched off' : u.mustChange ? ' · hasn’t set a password yet' : ''}
          </span>
        </td>
        <td>{s?.attempts ?? 0}</td>
        <td>{s?.marks ? `${Math.round((100 * s.scored) / s.marks)}%` : '—'}</td>
        <td>{when(s?.lastActive || u.lastSeen)}</td>
        <td>
          <div className="btn-row">
            <button className="btn btn-small btn-primary" onClick={() => setViewing(!viewing)} aria-expanded={viewing} aria-label={`${viewing ? 'Hide' : 'View'} ${u.name}'s work`}>
              {viewing ? 'Hide work' : 'View work'}
            </button>
            <a className="btn btn-small" href={href(`/report/${u.id}`)} aria-label={`Progress report for ${u.name}`}>
              Report
            </a>
            <button
              className="btn btn-small"
              disabled={busy}
              aria-label={`Reset password for ${u.name}`}
              onClick={() =>
                window.confirm(`Reset ${u.name}'s password? Their old one stops working, and they choose a new one next time they sign in.`) &&
                act(async () => {
                  await resetLogin(u.id);
                  setSlip({ name: u.name, username: u.username, reset: true });
                })
              }
            >
              Reset password
            </button>
            {u.id !== me.id && (
              <>
                <button className="btn btn-small" disabled={busy} onClick={() => act(() => setLoginAdmin(u.id, !u.admin))} aria-label={`${u.admin ? 'Remove admin from' : 'Make admin'} ${u.name}`}>
                  {u.admin ? 'Remove admin' : 'Make admin'}
                </button>
                <button className="btn btn-small" disabled={busy} onClick={() => act(() => setLoginDisabled(u.id, !u.disabled))} aria-label={`${u.disabled ? 'Switch on' : 'Switch off'} ${u.name}`}>
                  {u.disabled ? 'Switch on' : 'Switch off'}
                </button>
                <button
                  className="btn btn-small btn-danger"
                  disabled={busy}
                  onClick={() => window.confirm(`Remove ${u.name}'s login and all their saved progress? This can't be undone.`) && act(() => deleteLogin(u.id))}
                  aria-label={`Remove ${u.name}`}
                >
                  Remove
                </button>
              </>
            )}
          </div>
          <Problem text={problem} />
        </td>
      </tr>
      {slip && (
        <tr>
          <td colSpan={5}>
            <Slip {...slip} onDone={() => setSlip(null)} />
          </td>
        </tr>
      )}
      {viewing && (
        <tr>
          <td colSpan={5}>
            <WorkPanel name={u.name} work={work} />
          </td>
        </tr>
      )}
    </>
  );
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60_000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
const pct = (got: number, of: number) => (of ? `${Math.round((100 * got) / of)}%` : '—');
const paperName = (id: string) => {
  const p = PAST_PAPER_BY_ID.get(id);
  return p ? `${p.series} ${PAPER_TITLES[p.paper].split(':')[0]}` : id;
};

/** One person's work, from what their app shares with admins (activity.ts). */
function WorkPanel({ name, work }: { name: string; work?: ActivitySummary }) {
  if (!work) return <p className="small muted">{name} hasn’t saved any work since this was added — it appears after their next practice.</p>;
  const t = work.totals;
  const weak = work.chapters.filter((c) => c.questions >= 2).slice(0, 5);
  return (
    <div className="work-panel stack">
      <div className="kpis">
        <div className="card kpi">
          <b>{t.questions}</b>
          <span className="muted small">questions · {pct(t.scored, t.marks)} of marks</span>
        </div>
        <div className="card kpi">
          <b>{t.week.questions}</b>
          <span className="muted small">this week · {pct(t.week.scored, t.week.marks)}</span>
        </div>
        <div className="card kpi">
          <b>{t.streak}</b>
          <span className="muted small">day streak</span>
        </div>
        <div className="card kpi">
          <b>{Math.round(t.minutes / 60)}h</b>
          <span className="muted small">practising in all</span>
        </div>
      </div>
      {weak.length > 0 && (
        <div>
          <h3 className="h3">Weakest topics</h3>
          <ul className="list small">
            {weak.map((c) => (
              <li key={c.chapter} className="row-wrap work-line">
                <span style={{ flex: 1 }}>{c.title}</span>
                <span className="chip">{c.pct}%</span>
                <span className="muted">{c.questions} questions</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {work.recent.length > 0 && (
        <div>
          <h3 className="h3">Recent questions</h3>
          <ul className="list small">
            {work.recent.slice(0, 12).map((r, i) => (
              <li key={i} className="row-wrap work-line">
                <span style={{ flex: 1 }}>{r.title}</span>
                <span className={`chip ${r.scored === r.marks ? 'chip-accent' : ''}`}>
                  {r.scored}/{r.marks}
                </span>
                <span className="muted">{ago(r.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {work.papers.length > 0 && (
        <div>
          <h3 className="h3">Real past papers</h3>
          <ul className="list small">
            {work.papers.map((p) => (
              <li key={p.id} className="row-wrap work-line">
                <span style={{ flex: 1 }}>{paperName(p.id)}</span>
                <span className="chip">{p.complete ? `${p.got}/${p.max}` : `${p.got}/${p.of} so far`}</span>
                <span className="muted">{p.done ?? ago(p.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {work.sets.length > 0 && (
        <div>
          <h3 className="h3">Mocks and timed sets</h3>
          <ul className="list small">
            {work.sets.map((x, i) => (
              <li key={i} className="row-wrap work-line">
                <span style={{ flex: 1 }}>{x.title}</span>
                <span className="chip">
                  {x.got}/{x.of} ({pct(x.got, x.of)})
                </span>
                <span className="muted">{ago(x.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small">Updated {ago(work.updatedAt)}. Only admins (and {name}) can see this.</p>
    </div>
  );
}

/** The latest questions across everyone. */
function ActivityFeed({ members, work }: { members: Member[]; work: Map<string, ActivitySummary> }) {
  const items = members
    .flatMap((m) => (work.get(m.id)?.recent ?? []).map((r) => ({ ...r, name: m.name })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 20);
  return (
    <section className="card stack" aria-labelledby="everyone-work">
      <h2 id="everyone-work">What everyone’s doing</h2>
      {items.length ? (
        <ul className="list small">
          {items.map((r, i) => (
            <li key={i} className="row-wrap work-line">
              <b style={{ minWidth: '6em' }}>{r.name}</b>
              <span style={{ flex: 1 }}>{r.title}</span>
              <span className={`chip ${r.scored === r.marks ? 'chip-accent' : ''}`}>
                {r.scored}/{r.marks}
              </span>
              <span className="muted">{ago(r.at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Nothing yet — work shows here once people practise while signed in.</p>
      )}
      <p className="muted small">
        Use View work on a login below for one person’s topics, past papers and mocks, or <a href={href('/report/all')}>print progress reports for everyone</a>.
      </p>
    </section>
  );
}

/** Logins made on this device before logins went online: make online ones with the same usernames. */
function MoveDeviceLogins({ existing, onDone }: { existing: Member[]; onDone: () => void }) {
  const todo = deviceLogins().filter((d) => !existing.some((m) => m.username === d.username));
  const [slips, setSlips] = useState<SlipInfo[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  if (!todo.length && !slips.length) return null;
  return (
    <section className="card stack">
      <h2>Logins from this device</h2>
      {todo.length > 0 && (
        <>
          <p className="small">
            {todo.map((d) => d.name).join(', ')} {todo.length === 1 ? 'has a login' : 'have logins'} made on this device only. Make online logins for them with the same usernames: when they sign in here, their progress moves across.
          </p>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={async () => {
                setProblem(null);
                const made: SlipInfo[] = [];
                try {
                  for (const d of todo) {
                    await createLogin({ username: d.username, name: d.name, admin: d.admin });
                    made.push({ name: d.name, username: d.username });
                  }
                } catch (err) {
                  setProblem(message(err));
                }
                setSlips(made);
                onDone();
              }}
            >
              Make online logins for them
            </button>
          </div>
        </>
      )}
      <Problem text={problem} />
      {slips.map((s) => (
        <Slip key={s.username} {...s} onDone={() => setSlips((x) => x.filter((y) => y.username !== s.username))} />
      ))}
    </section>
  );
}

export function CloudManage() {
  const m = useCloudMe();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [work, setWork] = useState<Map<string, ActivitySummary>>(new Map());
  const [problem, setProblem] = useState<string | null>(null);
  const load = () => {
    group()
      .then(setMembers)
      .catch((e) => setProblem(message(e)));
    activities()
      .then(setWork)
      .catch(() => {});
  };
  useEffect(() => {
    if (m?.admin) void load();
  }, [m]);
  if (!m)
    return (
      <div className="stack">
        <h1>Manage logins</h1>
        <CloudSignIn />
      </div>
    );
  if (!m.admin)
    return (
      <ErrorBox>
        Only an admin can manage logins. <a href={href('/account')}>Your login</a>
      </ErrorBox>
    );
  return (
    <div className="stack">
      <h1>Manage logins</h1>
      <InvitePanel />
      <section className="card stack">
        <h2>Make a login</h2>
        <p className="small muted">Just a name and a username: they choose their own password the first time they sign in, from the link in the message you send them. Logins work on any phone, tablet or computer, and each person's progress, history and settings are saved to theirs.</p>
        <AddLogin onAdded={() => void load()} taken={(members ?? []).map((x) => x.username)} />
      </section>
      {members && <ActivityFeed members={members} work={work} />}
      {members && <MoveDeviceLogins existing={members} onDone={() => void load()} />}
      <section className="card stack">
        <h2>Logins</h2>
        <Problem text={problem} />
        {!members && !problem ? (
          <Loading />
        ) : members ? (
          <TableWrap label="Logins">
            <table className="data logins-table">
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Score</th>
                  <th scope="col">Last active</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((u) => (
                  <Row key={u.id} u={u} me={m} work={work.get(u.id)} onChange={() => void load()} />
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : null}
      </section>
    </div>
  );
}

