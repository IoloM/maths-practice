import { useRoute, href } from './router';
import { Home } from './pages/Home';
import { Topics } from './pages/Topics';
import { ChapterPage } from './pages/Chapter';
import { lazy, Suspense } from 'react';
import { Loading } from './components/bits';

// heavier pages (marking engine, maths input, charts) load on demand; the service worker precaches them all
const Practice = lazy(() => import('./pages/Practice').then((m) => ({ default: m.Practice })));
const QuestionPage = lazy(() => import('./pages/QuestionPage').then((m) => ({ default: m.QuestionPage })));
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Exams = lazy(() => import('./pages/Exams').then((m) => ({ default: m.Exams })));
const SetRunner = lazy(() => import('./pages/SetRunner').then((m) => ({ default: m.SetRunner })));
const ImportSet = lazy(() => import('./pages/SetRunner').then((m) => ({ default: m.ImportSet })));
const Review = lazy(() => import('./pages/Review').then((m) => ({ default: m.Review })));
const Reference = lazy(() => import('./pages/Reference').then((m) => ({ default: m.Reference })));
const Flashcards = lazy(() => import('./pages/Flashcards').then((m) => ({ default: m.Flashcards })));
const Account = lazy(() => import('./pages/Logins').then((m) => ({ default: m.Account })));
const ManageLogins = lazy(() => import('./pages/Logins').then((m) => ({ default: m.ManageLogins })));
const Join = lazy(() => import('./pages/Logins').then((m) => ({ default: m.Join })));
const SignInScreen = lazy(() => import('./pages/Logins').then((m) => ({ default: m.SignInScreen })));
const CloudAccount = lazy(() => import('./pages/CloudLogins').then((m) => ({ default: m.CloudAccount })));
const CloudManage = lazy(() => import('./pages/CloudLogins').then((m) => ({ default: m.CloudManage })));
const CloudSignIn = lazy(() => import('./pages/CloudLogins').then((m) => ({ default: m.CloudSignIn })));
const ChoosePasswordScreen = lazy(() => import('./pages/CloudLogins').then((m) => ({ default: m.ChoosePasswordScreen })));
const Group = lazy(() => import('./pages/Group').then((m) => ({ default: m.Group })));
const PrintSet = lazy(() => import('./pages/PrintSet').then((m) => ({ default: m.PrintSet })));
const PastPapers = lazy(() => import('./pages/PastPapers').then((m) => ({ default: m.PastPapers })));
import { InstallBanner } from './components/Install';
import { UpdateBanner } from './components/UpdateBanner';
import { Icon } from './components/Icon';
import { ErrorBox } from './components/bits';
import { NAV } from './nav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cloudMode, currentLogin, needsSignIn } from './lib/logins';

function Page({ path, parts, query }: ReturnType<typeof useRoute>) {
  switch (parts[0]) {
    case undefined:
      return <Home />;
    case 'topics':
      return <Topics />;
    case 'chapter':
      return <ChapterPage key={parts[1]} chapter={parts[1]} />;
    case 'practice':
      return <Practice key={query.toString()} query={query} />;
    case 'q':
      return <QuestionPage id={parts[1]} seed={Number(parts[2])} />;
    case 'progress':
      return <Progress />;
    case 'exams':
      return <Exams />;
    case 'set':
      return parts[1] === 'import' ? <ImportSet code={query.get('c') ?? ''} /> : <SetRunner key={parts[1]} id={parts[1]} />;
    case 'review':
      return <Review />;
    case 'reference':
      return <Reference />;
    case 'flashcards':
      return <Flashcards />;
    case 'past-papers':
      return <PastPapers open={query.get('p') ?? undefined} />;
    case 'settings':
      return <Settings />;
    case 'print':
      return <PrintSet key={parts[1]} id={parts[1]} />;
    case 'account':
      return cloudMode ? <CloudAccount /> : <Account />;
    case 'logins':
      return cloudMode ? <CloudManage /> : <ManageLogins />;
    case 'group':
      return <Group />;
    case 'join':
      return <Join code={query.get('c') ?? ''} />;
    default:
      return (
        <ErrorBox>
          Page not found: {path}. <a href="#/">Go home</a>
        </ErrorBox>
      );
  }
}

export default function App() {
  const route = useRoute();
  // logins are set up on this device but nobody is signed in: only the sign-in screen (or a setup link);
  // signed in with a temporary password: choose your own first
  const me = currentLogin();
  const mustChoose = cloudMode && !!me?.mustChange;
  const locked = (needsSignIn() && route.parts[0] !== 'join') || mustChoose;
  const lockScreen = mustChoose ? <ChoosePasswordScreen /> : cloudMode ? <CloudSignIn screen /> : <SignInScreen />;
  const active = (p: string) => (p === '/' ? route.path === '/' || route.parts[0] === 'practice' || route.parts[0] === 'q' : route.path.startsWith(p) || (p === '/topics' && route.parts[0] === 'chapter') || (p === '/exams' && (route.parts[0] === 'set' || route.parts[0] === 'print')) || (p === '/settings' && ['account', 'logins', 'join', 'group'].includes(route.parts[0])) || (p === '/reference' && route.parts[0] === 'flashcards') || (p === '/exams' && route.parts[0] === 'past-papers'));
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <a className="brand" href={href('/')}>
            <span className="brand-mark" aria-hidden="true">
              ∫
            </span>
            <span>Maths Practice</span>
          </a>
          {!locked && (
          <nav className="nav nav-desktop" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.path} href={href(n.path)} aria-current={active(n.path) ? 'page' : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          )}
          {me && (
            <a className="who-chip" href={href('/account')} aria-label={`Signed in as ${me.name}`} title="Your login">
              <span className="who-initial" aria-hidden="true">
                {me.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="who-name">{me.name}</span>
            </a>
          )}
          {!me && cloudMode && !locked && (
            <a className="who-chip" href={href('/account')}>
              Sign in
            </a>
          )}
        </div>
      </header>
      <UpdateBanner />
      <InstallBanner />
      <main className="app-main" id="main" tabIndex={-1}>
        <ErrorBoundary key={route.path}>
          <Suspense fallback={<Loading />}>{locked ? lockScreen : <Page {...route} />}</Suspense>
        </ErrorBoundary>
      </main>
      {!locked && (
      <nav className="tabbar" aria-label="Main">
        {NAV.filter((n) => n.mobile).map((n) => (
          <a key={n.path} href={href(n.path)} aria-current={active(n.path) ? 'page' : undefined}>
            <Icon name={n.icon} />
            {n.label}
          </a>
        ))}
      </nav>
      )}
    </>
  );
}
