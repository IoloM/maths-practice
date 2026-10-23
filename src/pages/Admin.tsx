/** For admins: make logins for people, reset passwords, switch logins off, see who is practising. */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { href, shareUrl } from '../router';
import { USERNAME, createUser, deleteManagedUser, listUsers, resetPassword, updateManagedUser, type ManagedUser } from '../lib/account';
import { useAccount } from './Account';
import { ErrorBox, Loading, TableWrap } from '../components/bits';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const suggestUsername = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 32);
const when = (t: number | null | undefined) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** The details to send someone: where to go, username and temporary password. */
function LoginSlip({ name, username, password, onDone }: { name: string; username: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Maths Practice login for ${name}\nGo to: ${shareUrl('/account')}\nUsername: ${username}\nTemporary password: ${password}\n(You'll choose your own password after signing in.)`;
  return (
    <div className="panel" role="status">
      <div className="panel-title">Login ready — give these details to {name}</div>
      <div className="panel-body stack">
        <pre className="login-slip">{text}</pre>
        <p className="small muted">The temporary password is shown only now. If it gets lost, use Reset password.</p>
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
          <button className="btn" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateLogin({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slip, setSlip] = useState<{ name: string; username: string; password: string } | null>(null);
  const u = touched ? username : suggestUsername(name);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!USERNAME.test(u)) return setError('Usernames are 3–32 lower-case letters, numbers, dots, dashes or underscores.');
    setBusy(true);
    setError(null);
    try {
      const password = await createUser({ username: u, name, admin });
      setSlip({ name: name.trim(), username: u, password });
      setName('');
      setUsername('');
      setTouched(false);
      setAdmin(false);
      onCreated();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  if (slip) return <LoginSlip {...slip} onDone={() => setSlip(null)} />;
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
        <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
        <span>Admin (can make and manage logins too)</span>
      </label>
      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={busy || !name.trim() || !u}>
          {busy ? 'Making login…' : 'Make login'}
        </button>
      </div>
      {error && (
        <p className="small error-text" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function UserRow({ u, me, onChange }: { u: ManagedUser; me: number; onChange: () => void }) {
  const [slip, setSlip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const act = async (f: () => Promise<unknown>) => {
    setError(null);
    try {
      await f();
      onChange();
    } catch (err) {
      setError(message(err));
    }
  };
  const s = u.summary;
  return (
    <>
      <tr className={u.disabled ? 'muted' : ''}>
        <td>
          <b>{u.name}</b>
          <br />
          <span className="small muted">
            {u.username}
            {u.admin ? ' · admin' : ''}
            {u.disabled ? ' · switched off' : u.mustChange ? ' · hasn’t chosen a password yet' : ''}
          </span>
        </td>
        <td>{s?.attempts ?? 0}</td>
        <td>{s?.marks ? `${Math.round((100 * (s.scored ?? 0)) / s.marks)}%` : '—'}</td>
        <td>{when(s?.lastActive ?? u.lastSeen)}</td>
        <td>
          <div className="btn-row">
            <button className="btn btn-small" onClick={() => act(async () => setSlip(await resetPassword(u)))} aria-label={`Reset password for ${u.name}`}>
              Reset password
            </button>
            {u.id !== me && (
              <>
                <button className="btn btn-small" onClick={() => act(() => updateManagedUser(u, { disabled: !u.disabled }))} aria-label={`${u.disabled ? 'Switch on' : 'Switch off'} ${u.name}`}>
                  {u.disabled ? 'Switch on' : 'Switch off'}
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => window.confirm(`Delete ${u.name}'s login and all their saved progress? This can't be undone.`) && act(() => deleteManagedUser(u))}
                  aria-label={`Delete ${u.name}`}
                >
                  Delete
                </button>
              </>
            )}
          </div>
          {error && (
            <p className="small error-text" role="alert">
              {error}
            </p>
          )}
        </td>
      </tr>
      {slip && (
        <tr>
          <td colSpan={5}>
            <LoginSlip name={u.name} username={u.username} password={slip} onDone={() => setSlip(null)} />
          </td>
        </tr>
      )}
    </>
  );
}

export function Admin() {
  const account = useAccount();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    listUsers()
      .then(setUsers)
      .catch((e) => setError(message(e)));
  }, []);
  useEffect(() => {
    if (account?.user.admin) load();
  }, [account, load]);

  if (!account?.user.admin)
    return (
      <ErrorBox>
        Only an admin can manage logins. <a href={href('/account')}>Sign in</a>
      </ErrorBox>
    );
  return (
    <div className="stack">
      <h1>Manage logins</h1>
      <section className="card stack">
        <h2>Make a login</h2>
        <p className="small muted">You'll get a temporary password to give them; they choose their own the first time they sign in. Each person's progress, history and settings are kept with their login.</p>
        <CreateLogin onCreated={load} />
      </section>
      <section className="card stack">
        <h2>Logins</h2>
        {error && <ErrorBox>{error}</ErrorBox>}
        {!users && !error ? (
          <Loading />
        ) : users ? (
          <TableWrap label="Logins">
            <table className="data admin-table">
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
                {users.map((u) => (
                  <UserRow key={u.id} u={u} me={account.user.id} onChange={load} />
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : null}
      </section>
    </div>
  );
}
