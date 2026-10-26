/**
 * Online logins (cloud.ts): signing in on any device, your login (#/account), and the admin's page
 * for making and managing logins (#/logins).
 */
import { useEffect, useState, type FormEvent } from 'react';
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
  type ActivitySummary,
  type Me,
  type Member,
} from '../lib/cloud';
import { deviceLogins, chooseGuest } from '../lib/logins';
import { onSyncStatus, startAutoSync, syncNow, syncStatus, type SyncStatus } from '../lib/sync';
import { ErrorBox, Loading, TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

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
  const [username, setUsername] = useState(recent.length === 1 ? recent[0].username : '');
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
  const text = `${reset ? `Your Maths Practice password has been reset, ${name}.` : `Your Maths Practice login, ${name}:`}\nGo to: ${shareUrl('/account')}\nUsername: ${username}\nThen choose your own password. It works on any phone, tablet or computer.`;
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
              try {
                if (navigator.share) await navigator.share({ title: 'Maths Practice login', text });
                else {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                }
              } catch {
                /* cancelled */
              }
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

function AddLogin({ onAdded }: { onAdded: () => void }) {
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
      <section className="card stack">
        <h2>Make a login</h2>
        <p className="small muted">Just a name and a username: they choose their own password the first time they sign in. Logins work on any phone, tablet or computer, and each person's progress, history and settings are saved to theirs.</p>
        <AddLogin onAdded={() => void load()} />
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

