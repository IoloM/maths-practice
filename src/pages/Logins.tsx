/**
 * Logins on this device: the sign-in screen, your own login (#/account), the admin's page for
 * setting people up (#/logins), and the page a setup link opens on someone's own device (#/join).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { href, shareUrl } from '../router';
import {
  MIN_PASSWORD,
  USERNAME,
  acceptJoin,
  addLogin,
  allLogins,
  changePassword,
  currentLogin,
  findForSignIn,
  isSetUpHere,
  joinCode,
  loginStats,
  loginsEnabled,
  parseJoin,
  removeLogin,
  resetPassword,
  setAdmin,
  setUpFirstLogin,
  signIn,
  signOut,
  type Login,
} from '../lib/logins';
import { ErrorBox, TableWrap } from '../components/bits';

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
const when = (t: number | null) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function NewPassword({ label = 'New password', value, again, onValue, onAgain }: { label?: string; value: string; again: string; onValue: (v: string) => void; onAgain: (v: string) => void }) {
  return (
    <>
      <label className="stack">
        <span className="small">
          {label} ({MIN_PASSWORD}+ characters — a PIN is fine)
        </span>
        <input type="password" value={value} onChange={(e) => onValue(e.target.value)} autoComplete="new-password" required />
      </label>
      <label className="stack">
        <span className="small">{label} again</span>
        <input type="password" value={again} onChange={(e) => onAgain(e.target.value)} autoComplete="new-password" required />
      </label>
    </>
  );
}
const pairProblem = (a: string, b: string) => (a.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : a !== b ? 'The two passwords are different.' : null);

function Problem({ text }: { text: string | null }) {
  return text ? (
    <p className="small error-text" role="alert">
      {text}
    </p>
  ) : null;
}

// ---------------------------------------------------------------- sign-in screen
export function SignInScreen() {
  const people = allLogins();
  const [who, setWho] = useState<Login | null>(people.length === 1 ? people[0] : null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'password' | 'choose'>('password');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const admins = people.filter((p) => p.admin).map((p) => p.name);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setProblem(null);
    setBusy(true);
    try {
      const name = who?.username ?? username;
      if (step === 'password') {
        const u = await findForSignIn(name, password);
        if (u.mustChange) {
          setStep('choose');
          return;
        }
        await signIn(name, password);
      } else {
        const p = pairProblem(next, again);
        if (p) return setProblem(p);
        await signIn(name, password, next);
      }
      restart(window.location.hash.replace(/^#/, '') || '/');
    } catch (err) {
      setProblem(message(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack signin">
      <h1>Who’s practising?</h1>
      {!who ? (
        <>
          <div className="who-list">
            {people.map((p) => (
              <button key={p.id} className="btn who" onClick={() => setWho(p)}>
                <span className="who-initial" aria-hidden="true">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                {p.name}
              </button>
            ))}
          </div>
          <details>
            <summary className="small">Sign in with a username</summary>
            <form className="stack" onSubmit={submit} style={{ marginTop: 8 }}>
              <label className="stack">
                <span className="small">Username</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
              </label>
              <label className="stack">
                <span className="small">Password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </label>
              <div className="btn-row">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Sign in
                </button>
              </div>
              <Problem text={problem} />
            </form>
          </details>
        </>
      ) : (
        <form className="card stack" onSubmit={submit}>
          <h2>{who.name}</h2>
          <input type="text" value={who.username} autoComplete="username" readOnly hidden />
          {step === 'password' ? (
            <label className="stack">
              <span className="small">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus required />
            </label>
          ) : (
            <>
              <p className="small">You signed in with a temporary password. Choose your own now — only you will know it.</p>
              <NewPassword value={next} again={again} onValue={setNext} onAgain={setAgain} />
            </>
          )}
          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {step === 'password' ? 'Sign in' : 'Set my password and sign in'}
            </button>
            {people.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setWho(null);
                  setPassword('');
                  setStep('password');
                  setProblem(null);
                }}
              >
                Not {who.name}?
              </button>
            )}
          </div>
          <Problem text={problem} />
        </form>
      )}
      {admins.length > 0 && <p className="muted small">Forgotten your password? Ask {admins.join(' or ')} to reset it.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- your login (#/account)
function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const p = pairProblem(next, again);
    if (p) return setState({ ok: false, text: p });
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setAgain('');
      setState({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setState({ ok: false, text: message(err) });
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <input type="text" value={currentLogin()?.username ?? ''} autoComplete="username" readOnly hidden />
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

function FirstLogin() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const u = touched ? username : suggestUsername(name);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const p = pairProblem(password, again);
    if (p) return setProblem(p);
    try {
      await setUpFirstLogin({ name, username: u, password });
      restart('/logins');
    } catch (err) {
      setProblem(message(err));
    }
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <h2>Set up logins</h2>
      <p className="small">
        Let several people use the app on this device, each with their own progress, history and settings. Start with your own login — you'll be its admin, and the progress already here becomes yours. Then you can make logins for other people, or send them a link to set
        one up on their own phone or tablet.
      </p>
      <div className="row-wrap">
        <label className="stack grow">
          <span className="small">Your name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
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
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
      </div>
      <NewPassword label="Password" value={password} again={again} onValue={setPassword} onAgain={setAgain} />
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={!name.trim() || !u}>
          Make my login
        </button>
      </div>
      <Problem text={problem} />
      <p className="muted small">Logins keep people's work apart on a shared device. Without a server they stay on this device: to move progress to another device, use Back up and Restore in Settings.</p>
    </form>
  );
}

export function Account() {
  const me = currentLogin();
  if (!me)
    return (
      <div className="stack">
        <h1>Logins</h1>
        <FirstLogin />
      </div>
    );
  return (
    <div className="stack">
      <h1>Your login</h1>
      <section className="card stack">
        <h2>
          {me.name} <span className="muted small">({me.username})</span>
        </h2>
        <p className="small">Your progress, history and settings on this device belong to this login.</p>
        <div className="btn-row">
          {me.admin && (
            <a className="btn btn-primary" href={href('/logins')}>
              Manage logins
            </a>
          )}
          <button
            className="btn"
            onClick={() => {
              signOut();
              restart('/');
            }}
          >
            Sign out
          </button>
        </div>
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
function Slip({ login, password, onDone }: { login: Login; password?: string; onDone: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const link = shareUrl(`/join?c=${joinCode(login)}`);
  const linkText = `Set up your Maths Practice login, ${login.name}: open this link on your phone or tablet and choose a password.\n${link}`;
  const here = password ? `Maths Practice login for ${login.name} (on this device)\nUsername: ${login.username}\nTemporary password: ${password}\n(Choose your own password the first time you sign in.)` : '';
  const send = async (text: string, what: string) => {
    try {
      if (navigator.share) await navigator.share({ title: 'Maths Practice login', text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(what);
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="panel" role="status">
      <div className="panel-title">Login ready for {login.name}</div>
      <div className="panel-body stack">
        {password && (
          <>
            <p className="small">
              <b>On this device:</b> they sign in with
            </p>
            <pre className="login-slip">
              Username: {login.username}
              {'\n'}Temporary password: {password}
            </pre>
            <p className="small muted">They choose their own password the first time. The temporary password is shown only now.</p>
          </>
        )}
        <p className="small">
          <b>On their own phone or tablet:</b> send them this setup link. Opening it makes their login there, and they choose the password.
        </p>
        <pre className="login-slip">{link}</pre>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => void send(linkText, 'link')}>
            {copied === 'link' ? 'Link copied' : 'Send setup link'}
          </button>
          {password && (
            <button className="btn" onClick={() => void send(here, 'details')}>
              {copied === 'details' ? 'Copied' : 'Copy sign-in details'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLogin({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [admin, setAdminBox] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [made, setMade] = useState<{ login: Login; password: string } | null>(null);
  const u = touched ? username : suggestUsername(name);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setProblem(null);
    if (!USERNAME.test(u)) return setProblem('Usernames are lower-case letters and numbers (dots, dashes and underscores in the middle are fine), up to 32 characters.');
    try {
      setMade(await addLogin({ name, username: u, admin }));
      setName('');
      setUsername('');
      setTouched(false);
      setAdminBox(false);
      onAdded();
    } catch (err) {
      setProblem(message(err));
    }
  };
  if (made) return <Slip login={made.login} password={made.password} onDone={() => setMade(null)} />;
  return (
    <form className="stack" onSubmit={submit}>
      <div className="row-wrap">
        <label className="stack grow">
          <span className="small">Their name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
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
        <input type="checkbox" checked={admin} onChange={(e) => setAdminBox(e.target.checked)} />
        <span>Admin (can manage logins too)</span>
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={!name.trim() || !u}>
          Make login
        </button>
      </div>
      <Problem text={problem} />
    </form>
  );
}

function LoginRow({ u, me, onChange }: { u: Login; me: Login; onChange: () => void }) {
  const [stats, setStats] = useState<{ attempts: number; lastActive: number | null } | null>(null);
  const [slip, setSlip] = useState<{ password?: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    void loginStats(u).then(setStats);
  }, [u]);
  const act = async (f: () => unknown) => {
    setProblem(null);
    try {
      await f();
      onChange();
    } catch (err) {
      setProblem(message(err));
    }
  };
  return (
    <>
      <tr>
        <td>
          <b>{u.name}</b>
          {u.id === me.id && <span className="muted small"> (you)</span>}
          <br />
          <span className="small muted">
            {u.username}
            {u.admin ? ' · admin' : ''}
            {u.mustChange ? ' · temporary password' : ''}
          </span>
        </td>
        <td>{stats?.attempts ?? '…'}</td>
        <td>{stats ? when(stats.lastActive) : '…'}</td>
        <td>
          <div className="btn-row">
            <button className="btn btn-small" onClick={() => setSlip({})} aria-label={`Setup link for ${u.name}`}>
              Setup link
            </button>
            {u.id !== me.id && (
              <>
                <button className="btn btn-small" onClick={() => act(async () => setSlip({ password: await resetPassword(u.id) }))} aria-label={`Reset password for ${u.name}`}>
                  Reset password
                </button>
                <button className="btn btn-small" onClick={() => act(() => setAdmin(u.id, !u.admin))} aria-label={`${u.admin ? 'Remove admin from' : 'Make admin'} ${u.name}`}>
                  {u.admin ? 'Remove admin' : 'Make admin'}
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => window.confirm(`Remove ${u.name}'s login and all their progress on this device? This can't be undone.`) && act(() => removeLogin(u.id))}
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
          <td colSpan={4}>
            <Slip login={u} password={slip.password} onDone={() => setSlip(null)} />
          </td>
        </tr>
      )}
    </>
  );
}

export function ManageLogins() {
  const me = currentLogin();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  if (!loginsEnabled())
    return (
      <div className="stack">
        <h1>Manage logins</h1>
        <FirstLogin />
      </div>
    );
  if (!me?.admin)
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
        <p className="small muted">You'll get a temporary password for this device, and a setup link for their own phone or tablet. Each login has its own progress, history and settings.</p>
        <AddLogin onAdded={refresh} />
      </section>
      <section className="card stack">
        <h2>Logins on this device</h2>
        <TableWrap label="Logins">
          <table className="data logins-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Questions</th>
                <th scope="col">Last active</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {allLogins().map((u) => (
                <LoginRow key={u.id} u={u} me={me} onChange={refresh} />
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="muted small">Logins live on this device (there's no server). Removing a login deletes its progress here.</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- a setup link opened on someone's own device (#/join)
export function Join({ code }: { code: string }) {
  const info = parseJoin(code);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  if (!info) return <ErrorBox>This setup link isn't valid — ask for a new one.</ErrorBox>;
  if (isSetUpHere(info.username))
    return (
      <div className="stack">
        <h1>Welcome back, {info.name}</h1>
        <p className="card">
          Your login is already set up on this device. {currentLogin()?.username === info.username ? <a href={href('/')}>Start practising</a> : 'Sign in to carry on.'}
        </p>
      </div>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const p = pairProblem(password, again);
    if (p) return setProblem(p);
    try {
      await acceptJoin(info, password);
      restart('/');
    } catch (err) {
      setProblem(message(err));
    }
  };
  return (
    <div className="stack">
      <h1>Welcome, {info.name}</h1>
      <form className="card stack" onSubmit={submit}>
        <p className="small">
          This sets up your Maths Practice login (<b>{info.username}</b>) on this device. Choose a password: you'll use it to sign in here.
        </p>
        <input type="text" value={info.username} autoComplete="username" readOnly hidden />
        <NewPassword label="Password" value={password} again={again} onValue={setPassword} onAgain={setAgain} />
        <div className="btn-row">
          <button className="btn btn-primary" type="submit">
            Set up my login
          </button>
        </div>
        <Problem text={problem} />
        {!loginsEnabled() && <p className="muted small">Anything already practised on this device becomes part of your login.</p>}
      </form>
    </div>
  );
}
