import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import { BusinessTypeProvider } from './config/BusinessTypeContext';
import { queryClient } from './lib/queryClient';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ProgressCentre = lazy(() => import('./pages/ProgressCentre'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const TrustFund = lazy(() => import('./pages/TrustFund'));
const Adashe = lazy(() => import('./pages/Adashe'));
const TaskaCooperative = lazy(() => import('./pages/TaskaCooperative'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const Production = lazy(() => import('./pages/Production'));
const GrainMillingOps = lazy(() => import('./pages/GrainMillingOps'));
const LivestockMarketOps = lazy(() => import('./pages/LivestockMarketOps'));
const LeatherTradingOps = lazy(() => import('./pages/LeatherTradingOps'));
const BillingSettings = lazy(() => import('./pages/BillingSettings'));
const Partners = lazy(() => import('./pages/Partners'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Students = lazy(() => import('./pages/Students'));
const Classes = lazy(() => import('./pages/Classes'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Consultations = lazy(() => import('./pages/Consultations'));
const Fees = lazy(() => import('./pages/Fees'));
const LabRequests = lazy(() => import('./pages/LabRequests'));
const Patients = lazy(() => import('./pages/Patients'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Results = lazy(() => import('./pages/Results'));
const Rooms = lazy(() => import('./pages/Rooms'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Debtors = lazy(() => import('./pages/Debtors'));
const Transfers = lazy(() => import('./pages/Transfers'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const TextileOps = lazy(() => import('./pages/TextileOps'));
const LivestockOps = lazy(() => import('./pages/LivestockOps'));
const BuildingMaterialsOps = lazy(() => import('./pages/BuildingMaterialsOps'));
const AgroOps = lazy(() => import('./pages/AgroOps'));
const BeautyOps = lazy(() => import('./pages/BeautyOps'));
const CommodityOps = lazy(() => import('./pages/CommodityOps'));
const FarmOps = lazy(() => import('./pages/FarmOps'));
const FuelOps = lazy(() => import('./pages/FuelOps'));
const LogisticsOps = lazy(() => import('./pages/LogisticsOps'));
const MobileAgentOps = lazy(() => import('./pages/MobileAgentOps'));
const WarehouseOps = lazy(() => import('./pages/WarehouseOps'));
const PureWaterRetailOps = lazy(() => import('./pages/PureWaterRetailOps'));
const RestaurantPOS = lazy(() => import('./pages/RestaurantPOS'));
const RetailOps = lazy(() => import('./pages/RetailOps'));
const ServiceOps = lazy(() => import('./pages/ServiceOps'));
const SMEOps = lazy(() => import('./pages/SMEOps'));
const WholesaleOps = lazy(() => import('./pages/WholesaleOps'));

import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import DemoAccounts from './pages/DemoAccounts';
import DemoLanding from './pages/DemoLanding';
import DemoIndustry from './pages/DemoIndustry';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import SelectBusiness from './pages/SelectBusiness';
import CreateBusiness from './pages/CreateBusiness';

function PageLoader() {
  return (
    <div className="app-loader flex min-h-screen items-center justify-center p-4">
      <div className="public-card inline-flex min-w-[260px] flex-col items-center gap-3 rounded-3xl px-6 py-5 text-center shadow-[var(--shadow-md)]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[var(--color-brand)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Loading workspace</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Preparing your business data and modules.</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    if (token && !user && !isHydrating) {
      void fetchProfile();
    }
  }, [fetchProfile, isHydrating, token, user]);

  if (!token) return <Navigate to="/login" />;
  if (!user) return <PageLoader />;
  return <BusinessTypeProvider>{children}</BusinessTypeProvider>;
}

function BusinessAppRoute({ children }) {
  const business = useAuthStore((s) => s.business);
  const businesses = useAuthStore((s) => s.businesses);
  const needsBusinessSelection = useAuthStore((s) => s.needsBusinessSelection);
  const needsBusinessOnboarding = useAuthStore((s) => s.needsBusinessOnboarding);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const user = useAuthStore((s) => s.user);

  if (!user && isHydrating) {
    return <PageLoader />;
  }

  if (needsBusinessOnboarding || businesses.length === 0) {
    return <Navigate to="/businesses/new" replace />;
  }

  if (needsBusinessSelection) {
    return <Navigate to="/business-select" replace />;
  }

  if (!business) {
    return <Navigate to="/business-select" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/demo" element={<DemoLanding />} />
          <Route path="/demo/retail" element={<DemoIndustry industry="retail" />} />
          <Route path="/demo/pharmacy" element={<DemoIndustry industry="pharmacy" />} />
          <Route path="/demo/supermarket" element={<DemoIndustry industry="supermarket" />} />
          <Route path="/demo/restaurant" element={<DemoIndustry industry="restaurant" />} />
          <Route path="/demo/hotel" element={<DemoIndustry industry="hotel" />} />
          <Route path="/demo/clinic" element={<DemoIndustry industry="clinic" />} />
          <Route path="/demo/school" element={<DemoIndustry industry="school" />} />
          <Route path="/demo/pure-water" element={<DemoIndustry industry="pure_water_factory" />} />
          <Route path="/demo/pure_water_factory" element={<Navigate to="/demo/pure-water" replace />} />
          <Route path="/demo/accounts" element={<DemoAccounts />} />
          <Route path="/demo-accounts" element={<Navigate to="/demo/accounts" replace />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/business-select"
            element={(
              <ProtectedRoute>
                <SelectBusiness />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/businesses/new"
            element={(
              <ProtectedRoute>
                <CreateBusiness />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <BusinessAppRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Layout />
                  </Suspense>
                </BusinessAppRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="progress" element={<ProgressCentre />} />
            <Route path="pos" element={<POS />} />
            <Route path="orders" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="trust-fund" element={<TrustFund />} />
            <Route path="adashe" element={<Adashe />} />
            <Route path="cooperative" element={<TaskaCooperative />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="ai-insights" element={<AIInsights />} />
            <Route path="pharmacy" element={<Pharmacy />} />
            <Route path="production" element={<Production />} />
            <Route path="grain-milling" element={<GrainMillingOps />} />
            <Route path="livestock-market" element={<LivestockMarketOps />} />
            <Route path="leather-trading" element={<LeatherTradingOps />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="billing" element={<BillingSettings />} />
            <Route path="partners" element={<Partners />} />
            <Route path="students" element={<Students />} />
            <Route path="classes" element={<Classes />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="debtors" element={<Debtors />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="retail" element={<RetailOps />} />
            <Route path="restaurant" element={<RestaurantPOS />} />
            <Route path="tables" element={<RestaurantPOS />} />
            <Route path="kitchen" element={<RestaurantPOS />} />
            <Route path="wholesale" element={<WholesaleOps />} />
            <Route path="pure-water-retail" element={<PureWaterRetailOps />} />
            <Route path="agro" element={<AgroOps />} />
            <Route path="commodity" element={<CommodityOps />} />
            <Route path="logistics" element={<LogisticsOps />} />
            <Route path="mobile-agent" element={<MobileAgentOps />} />
            <Route path="fuel" element={<FuelOps />} />
            <Route path="beauty" element={<BeautyOps />} />
            <Route path="service-business" element={<ServiceOps />} />
            <Route path="general-sme" element={<SMEOps />} />
            <Route path="farm" element={<FarmOps />} />
            <Route path="warehouse" element={<WarehouseOps />} />
            <Route path="ngo-warehouse" element={<WarehouseOps />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="lab-requests" element={<LabRequests />} />
            <Route path="results" element={<Results />} />
            <Route path="variants" element={<TextileOps />} />
            <Route path="livestock" element={<LivestockOps />} />
            <Route path="categories" element={<BuildingMaterialsOps />} />
            <Route path="contractors" element={<BuildingMaterialsOps />} />
            <Route path="quotations" element={<BuildingMaterialsOps />} />
            <Route path="credit-sales" element={<BuildingMaterialsOps />} />
            <Route path="yard-stock" element={<BuildingMaterialsOps />} />
            <Route path="price-management" element={<BuildingMaterialsOps />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
