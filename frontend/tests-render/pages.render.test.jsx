import { afterEach, describe, test, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { renderPage } from './renderPage.jsx';
import { useAuthStore } from '../src/stores/authStore.js';

// Flushes pending microtasks/timers (mocked query promises resolving, the
// re-renders they trigger) inside an act() scope, so any error thrown during
// that later render is captured by CapturingErrorBoundary before we assert.
async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

vi.mock('../src/lib/api.js', () => {
  // An empty array tolerates both common response shapes this codebase uses:
  // list/collection endpoints that return a raw array (`.filter`/`.map`
  // called directly on the response), and object-shaped endpoints accessed
  // via optional chaining (`stats?.field` is safely undefined against an
  // array too). An empty object would crash the former; either shape must
  // still be correct per-endpoint to catch real backend/frontend contract
  // drift - this is a coarse smoke net, not a substitute for that.
  const resolved = { data: [] };
  const handler = vi.fn(() => Promise.resolve(resolved));

  return {
    default: {
      get: handler,
      post: handler,
      patch: handler,
      put: handler,
      delete: handler,
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

const fakeAdminUser = {
  user: { id: 1, name: 'Test Owner', email: 'owner@example.com', role: 'admin' },
  business: { id: 1, name: 'Test Business', business_type: 'general' },
  businesses: [{ id: 1, name: 'Test Business', business_type: 'general' }],
  permissions: [],
  token: 'fake-token',
};

// Pages already proven risky earlier in this project's history - see
// docs/ENGINEERING_WORKPLAN_2026-08.md item 8. Add more pages here as they're
// swept; each entry costs one line since renderPage() does the rest.
const pagesUnderTest = [
  ['Dashboard', () => import('../src/pages/Dashboard.jsx')],
  ['Portfolio', () => import('../src/pages/Portfolio.jsx')],
  ['Adashe', () => import('../src/pages/Adashe.jsx')],
  ['TrustFund', () => import('../src/pages/TrustFund.jsx')],
  ['TaskaCooperative', () => import('../src/pages/TaskaCooperative.jsx')],
  ['Partners', () => import('../src/pages/Partners.jsx')],
  ['Deliveries', () => import('../src/pages/Deliveries.jsx')],
  ['Admin', () => import('../src/pages/Admin.jsx')],
  ['Debtors', () => import('../src/pages/Debtors.jsx')],
  ['Transfers', () => import('../src/pages/Transfers.jsx')],
  ['Production', () => import('../src/pages/Production.jsx')],
  ['AIInsights', () => import('../src/pages/AIInsights.jsx')],
  ['Settings', () => import('../src/pages/Settings.jsx')],
  ['BillingSettings', () => import('../src/pages/BillingSettings.jsx')],
  ['AgroOps', () => import('../src/pages/AgroOps.jsx')],
  ['Appointments', () => import('../src/pages/Appointments.jsx')],
  ['Attendance', () => import('../src/pages/Attendance.jsx')],
  ['BeautyOps', () => import('../src/pages/BeautyOps.jsx')],
  ['Bookings', () => import('../src/pages/Bookings.jsx')],
  ['BuildingMaterialsOps', () => import('../src/pages/BuildingMaterialsOps.jsx')],
  ['Classes', () => import('../src/pages/Classes.jsx')],
  ['CommodityOps', () => import('../src/pages/CommodityOps.jsx')],
  ['Consultations', () => import('../src/pages/Consultations.jsx')],
  ['Customers', () => import('../src/pages/Customers.jsx')],
  ['Expenses', () => import('../src/pages/Expenses.jsx')],
  ['FarmOps', () => import('../src/pages/FarmOps.jsx')],
  ['Fees', () => import('../src/pages/Fees.jsx')],
  ['FuelOps', () => import('../src/pages/FuelOps.jsx')],
  ['GrainMillingOps', () => import('../src/pages/GrainMillingOps.jsx')],
  ['LivestockMarketOps', () => import('../src/pages/LivestockMarketOps.jsx')],
  ['Inventory', () => import('../src/pages/Inventory.jsx')],
  ['LabRequests', () => import('../src/pages/LabRequests.jsx')],
  ['LivestockOps', () => import('../src/pages/LivestockOps.jsx')],
  ['LogisticsOps', () => import('../src/pages/LogisticsOps.jsx')],
  ['MobileAgentOps', () => import('../src/pages/MobileAgentOps.jsx')],
  ['NGOWarehouseOps', () => import('../src/pages/NGOWarehouseOps.jsx')],
  ['POS', () => import('../src/pages/POS.jsx')],
  ['Patients', () => import('../src/pages/Patients.jsx')],
  ['Pharmacy', () => import('../src/pages/Pharmacy.jsx')],
  ['Products', () => import('../src/pages/Products.jsx')],
  ['Purchases', () => import('../src/pages/Purchases.jsx')],
  ['PureWaterRetailOps', () => import('../src/pages/PureWaterRetailOps.jsx')],
  ['Reports', () => import('../src/pages/Reports.jsx')],
  ['RestaurantPOS', () => import('../src/pages/RestaurantPOS.jsx')],
  ['Results', () => import('../src/pages/Results.jsx')],
  ['RetailOps', () => import('../src/pages/RetailOps.jsx')],
  ['Rooms', () => import('../src/pages/Rooms.jsx')],
  ['SMEOps', () => import('../src/pages/SMEOps.jsx')],
  ['ServiceOps', () => import('../src/pages/ServiceOps.jsx')],
  ['Students', () => import('../src/pages/Students.jsx')],
  ['Suppliers', () => import('../src/pages/Suppliers.jsx')],
  ['TextileOps', () => import('../src/pages/TextileOps.jsx')],
  ['WarehouseOps', () => import('../src/pages/WarehouseOps.jsx')],
  ['WholesaleOps', () => import('../src/pages/WholesaleOps.jsx')],
];

describe('pages render without crashing', () => {
  for (const [name, loadModule] of pagesUnderTest) {
    test(`${name} renders without throwing`, async () => {
      useAuthStore.setState(fakeAdminUser);
      const { default: Component } = await loadModule();
      const { getRenderError } = renderPage(Component);

      await flushAsyncWork();

      const error = getRenderError();
      if (error) {
        throw error;
      }
    });
  }
});
