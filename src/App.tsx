import { useRoute, href } from './router';
import { Home } from './pages/Home';
import { Topics } from './pages/Topics';
import { ChapterPage } from './pages/Chapter';
import { Practice } from './pages/Practice';
import { QuestionPage } from './pages/QuestionPage';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { InstallBanner } from './components/Install';
import { UpdateBanner } from './components/UpdateBanner';
import { Icon } from './components/Icon';
import { ErrorBox } from './components/bits';

const NAV = [
  { path: '/', label: 'Practise', icon: 'home' },
  { path: '/topics', label: 'Topics', icon: 'book' },
  { path: '/progress', label: 'Progress', icon: 'chart' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

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
    case 'settings':
      return <Settings />;
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
  const active = (p: string) => (p === '/' ? route.path === '/' || route.parts[0] === 'practice' || route.parts[0] === 'q' : route.path.startsWith(p) || (p === '/topics' && route.parts[0] === 'chapter'));
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
          <nav className="nav nav-desktop" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.path} href={href(n.path)} aria-current={active(n.path) ? 'page' : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <UpdateBanner />
      <InstallBanner />
      <main className="app-main" id="main" tabIndex={-1}>
        <Page {...route} />
      </main>
      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.path} href={href(n.path)} aria-current={active(n.path) ? 'page' : undefined}>
            <Icon name={n.icon} />
            {n.label}
          </a>
        ))}
      </nav>
    </>
  );
}
