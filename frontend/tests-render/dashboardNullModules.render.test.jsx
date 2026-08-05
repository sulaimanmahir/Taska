import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { renderPage } from './renderPage.jsx';
import { useAuthStore } from '../src/stores/authStore.js';

async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

// Regression test for the Dashboard crash fixed in
// dashboardFinanceSummaries.js: the /dashboard endpoint returns an explicit
// `null` (not an absent key) for modules a business hasn't used yet, and
// `(summary = {})`-style default parameters do not apply to explicit null,
// only undefined - so this shape used to throw
// "Cannot read properties of null (reading 'pending_approvals')" on every
// business without existing cooperative/adashe/trust-fund data.
vi.mock('../src/lib/api.js', () => {
  const dashboardResponse = {
    data: {
      cooperative: null,
      adashe: null,
      trust_fund: null,
      today_sales: 0,
      orders_today: 0,
    },
  };
  const emptyResponse = { data: {} };

  const get = vi.fn((url) => {
    if (typeof url === 'string' && url.startsWith('/dashboard')) {
      return Promise.resolve(dashboardResponse);
    }
    return Promise.resolve(emptyResponse);
  });

  return {
    default: {
      get,
      post: vi.fn(() => Promise.resolve(emptyResponse)),
      patch: vi.fn(() => Promise.resolve(emptyResponse)),
      put: vi.fn(() => Promise.resolve(emptyResponse)),
      delete: vi.fn(() => Promise.resolve(emptyResponse)),
    },
  };
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({
    user: null,
    business: null,
    businesses: [],
    permissions: [],
    token: null,
  });
});

describe('Dashboard with null optional-module summaries', () => {
  test('renders the command center heading once the null-shaped response resolves', async () => {
    useAuthStore.setState({
      user: { id: 1, name: 'Test Owner', email: 'owner@example.com', role: 'admin' },
      business: { id: 1, name: 'Test Business', business_type: 'general' },
      businesses: [{ id: 1, name: 'Test Business', business_type: 'general' }],
      permissions: [],
      token: 'fake-token',
    });

    const { default: Dashboard } = await import('../src/pages/Dashboard.jsx');
    const { findByText, getRenderError } = renderPage(Dashboard);

    await flushAsyncWork();

    const error = getRenderError();
    if (error) {
      throw error;
    }

    expect(await findByText('Dashboard')).toBeInTheDocument();
  });
});
