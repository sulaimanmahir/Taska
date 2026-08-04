import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { actionGroupAriaLabel = 'Error recovery actions' } = this.props;

      return (
        <div className="flex min-h-dvh items-center justify-center bg-[var(--auth-bg)] px-4 py-6">
          <section
            role="alert"
            aria-labelledby="error-boundary-title"
            aria-describedby="error-boundary-description"
            className="w-full max-w-lg rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-[var(--card-padding)] text-center shadow-[var(--shadow-md)]"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[calc(var(--card-radius)-0.25rem)] border border-rose-100 bg-rose-50/90 shadow-[var(--shadow-sm)]">
              <svg className="h-8 w-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 id="error-boundary-title" className="mb-2 text-xl font-bold text-slate-900">Something went wrong</h1>
            <p id="error-boundary-description" className="mb-6 text-sm leading-6 text-slate-500">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row" role="group" aria-label={actionGroupAriaLabel}>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 rounded-[var(--field-radius)] border border-slate-300 bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[var(--shadow-sm)] transition hover:bg-slate-300"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-4 py-3 text-sm font-semibold text-slate-700 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white"
              >
                Refresh Page
              </button>
            </div>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
