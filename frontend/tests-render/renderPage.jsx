import { Component } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

// A page can throw either during its first synchronous render (e.g. a
// temporal-dead-zone bug) or later, once an async query resolves and
// triggers a re-render (e.g. a null-deref on freshly loaded data). The first
// kind surfaces as a plain thrown error from render(); the second happens
// outside any act()/findBy the test is awaiting and would otherwise show up
// only as a background "unhandled exception" that does not fail the test or
// the process exit code. Catching it locally makes both kinds equally
// assertable.
class CapturingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return null;
    }

    return this.props.children;
  }
}

export function renderPage(PageComponent, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const captured = { error: null };

  const utils = render(
    <CapturingErrorBoundary onError={(error) => { captured.error = error; }}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <PageComponent />
        </MemoryRouter>
      </QueryClientProvider>
    </CapturingErrorBoundary>
  );

  return {
    ...utils,
    getRenderError: () => captured.error,
  };
}
