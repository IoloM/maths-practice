import { Component, type ReactNode } from 'react';
import { ErrorBox } from './bits';

/** A page's code failed to download: usually a tab left open across an update, or offline before the app was cached. */
const isLoadError = (e: unknown) => e instanceof Error && /dynamically imported module|importing a module script failed|failed to fetch/i.test(e.message);

/** Shows a way out (reload / home) instead of a blank page when a page fails to load or render. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; error: unknown }> {
  state = { failed: false, error: undefined as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, error };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { error } = this.state;
    return (
      <ErrorBox>
        {isLoadError(error) ? (
          <p>This page could not be loaded. The app may have just been updated, or you may be offline before it finished saving itself for offline use.</p>
        ) : (
          <>
            <p>Something went wrong showing this page.</p>
            {error instanceof Error && <p className="small">{error.message}</p>}
          </>
        )}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <a className="btn" href="#/">
            Home
          </a>
        </div>
      </ErrorBox>
    );
  }
}
