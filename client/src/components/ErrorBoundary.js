import React from 'react';

/**
 * Catches render errors anywhere below it.
 *
 * Without this, one thrown error unmounts the whole tree and the user gets a
 * blank white page with no explanation - which is what happened when a page
 * received HTML instead of JSON and tried to map over it.
 *
 * A blank screen is the worst possible failure: it looks like the app is dead,
 * and it tells whoever is debugging nothing at all.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the real stack in the console for whoever is debugging.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900">Something broke on this page</h1>
          <p className="mt-2 text-sm text-gray-600">
            The rest of the app is fine. Go back and try again.
          </p>

          <div className="mt-6 flex gap-3 justify-center">
            <button className="btn-primary" onClick={() => window.location.assign('/')}>
              Back to home
            </button>
            <button className="btn-secondary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>

          {/* Shown in development only - useful while building, noise for a user. */}
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-6 text-left text-xs text-red-600 whitespace-pre-wrap break-words">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
