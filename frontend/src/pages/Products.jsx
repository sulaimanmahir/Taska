import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card from '../components/Card';
import { FinanceFormError } from '../components/FinanceFormFeedback';
import ModalShell, { ModalActions } from '../components/ModalShell';
import OpsMetricCard from '../components/OpsMetricCard';
import { ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useModalShell } from '../components/ModalShellContext';
import { useBusinessType } from '../config';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildInventorySummaryByProduct,
  buildProductOverviewMetrics,
  buildProductPayload,
  buildProductRow,
  createProductForm,
} from '../lib/products';
import BeautyOps from './BeautyOps';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import CommodityOps from './CommodityOps';
import FarmOps from './FarmOps';
import PureWaterRetailOps from './PureWaterRetailOps';
import ServiceOps from './ServiceOps';
import SMEOps from './SMEOps';
import TextileOps from './TextileOps';
import WholesaleOps from './WholesaleOps';

function ProductSkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      <td colSpan={7} className="px-5 py-4">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      </td>
    </tr>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function Products() {
  const { type } = useBusinessType();
  const emptyProductForm = createProductForm();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyProductForm);
  const [productFormError, setProductFormError] = useState('');
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();

  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/product-categories').then((response) => response.data.data || response.data || []),
  });

  const productsQuery = useQuery({
    queryKey: ['products', search, categoryFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', categoryFilter);
      return api.get(`/products?${params}`).then((response) => response.data);
    },
    keepPreviousData: true,
  });

  const lowStockProductsQuery = useQuery({
    queryKey: ['products', 'low-stock-count'],
    queryFn: () => api.get('/products?low_stock=1').then((response) => response.data),
  });

  const inventoryDataQuery = useQuery({
    queryKey: ['inventory', 'products-snapshot'],
    queryFn: () => api.get('/inventory').then((response) => response.data),
    staleTime: 60000,
  });

  const categories = categoriesQuery.data ?? [];
  const productsData = productsQuery.data;
  const isLoading = productsQuery.isLoading;
  const lowStockProducts = lowStockProductsQuery.data;
  const inventoryData = inventoryDataQuery.data;
  const productQueries = [categoriesQuery, productsQuery, lowStockProductsQuery, inventoryDataQuery];

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/products', buildProductPayload(payload)).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      clearToast();
      resetProductForm();
    },
    onError: (mutationError) => {
      const message = getErrorMessage(mutationError, 'We could not save that product right now.');
      setToast({ tone: 'error', message });
      setProductFormError(message);
    },
  });

  const resetProductForm = () => {
    setShowModal(false);
    setForm(createProductForm());
    setProductFormError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setProductFormError('Enter a product name before saving this catalog item.');
      return;
    }

    if (form.selling_price === '' || Number.isNaN(Number(form.selling_price)) || Number(form.selling_price) < 0) {
      setProductFormError('Enter a valid selling price before saving this product.');
      return;
    }

    setProductFormError('');
    createMutation.mutate(form);
  };

  if (type === 'textile') return <TextileOps />;
  if (type === 'construction') return <BuildingMaterialsOps />;
  if (type === 'commodity') return <CommodityOps />;
  if (type === 'wholesale') return <WholesaleOps />;
  if (type === 'beauty') return <BeautyOps />;
  if (type === 'service') return <ServiceOps />;
  if (type === 'pure_water_retail') return <PureWaterRetailOps />;
  if (type === 'farm') return <FarmOps />;
  if (type === 'mixed' || type === 'general') return <SMEOps />;

  const products = productsData?.data || [];
  const pagination = {
    currentPage: productsData?.current_page || 1,
    lastPage: productsData?.last_page || 1,
    total: productsData?.total || 0,
  };
  const inventoryItems = inventoryData?.data || inventoryData || [];
  const inventorySummary = buildInventorySummaryByProduct(inventoryItems);
  const loadError = getErrorMessage(
    productQueries.find((query) => query.isError)?.error,
    'We could not load part of the product workspace right now. Please try again.'
  );
  const lowStockTotal = lowStockProducts?.total || lowStockProducts?.data?.length || 0;
  const productModalDirty = JSON.stringify(form) !== JSON.stringify(emptyProductForm);

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Product feedback" />

      <PageHero
        eyebrow="Catalog Control"
        title="Products"
        description={`${pagination.total} products with pricing, stock behavior, and category control in one workspace.`}
        actions={(
          <Button
            onClick={() => {
              clearToast();
              resetProductForm();
              setShowModal(true);
            }}
          >
            New product
          </Button>
        )}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildProductOverviewMetrics({
          products,
          totalProducts: pagination.total,
          lowStockTotal,
          inventorySummary,
        }, formatCurrencyNGN).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <Card padding={false} className="overflow-hidden">
        {loadError ? (
          <QueryErrorPanel
            message={loadError}
            onRetry={() => {
              productQueries.forEach((query) => {
                query.refetch();
              });
            }}
          />
        ) : null}

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Catalog Register</p>
              <p className="mt-1 text-sm text-slate-500">
                Review pricing, stock posture, category assignment, and inventory tracking without leaving the product desk.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="input min-w-[260px]"
              />
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="input min-w-[220px]"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inventory</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, index) => <ProductSkeletonRow key={index} />) : null}

            {!isLoading && !products.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                  {search || categoryFilter ? 'No products matched the current search or category filter.' : 'No products yet'}
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? products.map((product) => {
                const productRow = buildProductRow(product, inventorySummary, formatCurrencyNGN);
                const stockToneClass = productRow.stockTone === 'rose'
                  ? 'text-rose-700'
                  : productRow.stockTone === 'amber'
                    ? 'text-amber-700'
                    : 'text-emerald-700';

                return (
                  <tr key={productRow.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{productRow.title}</p>
                      <p className="text-sm text-slate-500">{productRow.skuLabel}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{productRow.categoryLabel}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold capitalize text-sky-700">
                        {productRow.typeLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{productRow.trackInventoryLabel}</td>
                    <td className="px-5 py-4">
                      <p className={`font-medium ${stockToneClass}`}>{productRow.stockLabel}</p>
                      <p className="text-sm text-slate-500">{productRow.stockHelper}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{productRow.pricingLabel}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {productRow.statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
              : null}
          </tbody>
        </table>
      </Card>

      {pagination.lastPage > 1 ? (
        <Card padding={false} className="p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {pagination.currentPage} of {pagination.lastPage}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
              disabled={page === pagination.lastPage}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </Card>
      ) : null}

      {showModal ? (
        <ModalShell
          title="Save Product"
          subtitle="Capture pricing, stock behavior, and category in one cleaner product setup."
          size="lg"
          tone="violet"
          busy={createMutation.isPending}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={createMutation.isPending ? 'saving' : productModalDirty ? 'dirty' : null}
          draftStatePreset="setup"
          closeGuardPreset="cancelSetup"
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset="setup"
          headerBadgeLabel="Catalog setup"
          onClose={resetProductForm}
        >
          <ProductModalForm
            categories={categories}
            createMutation={createMutation}
            form={form}
            handleSubmit={handleSubmit}
            productFormError={productFormError}
            setForm={setForm}
            setProductFormError={setProductFormError}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function ProductModalForm({
  categories,
  createMutation,
  form,
  handleSubmit,
  productFormError,
  setForm,
  setProductFormError,
}) {
  const modal = useModalShell();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FinanceFormError message={productFormError} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => {
            setForm({ ...form, name: event.target.value });
            if (productFormError) {
              setProductFormError('');
            }
          }}
          className="input"
          placeholder="Enter product name"
          data-autofocus="true"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(event) => setForm({ ...form, sku: event.target.value })}
            className="input"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
          <select
            value={form.category_id}
            onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            className="input"
          >
            <option value="">Select</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Cost Price</label>
          <input
            type="number"
            min="0"
            value={form.cost_price}
            onChange={(event) => setForm({ ...form, cost_price: event.target.value })}
            className="input"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Selling Price *</label>
          <input
            type="number"
            min="0"
            value={form.selling_price}
            onChange={(event) => {
              setForm({ ...form, selling_price: event.target.value });
              if (productFormError) {
                setProductFormError('');
              }
            }}
            className="input"
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Type</label>
          <select
            value={form.product_type}
            onChange={(event) => setForm({ ...form, product_type: event.target.value })}
            className="input"
          >
            <option value="good">Good</option>
            <option value="service">Service</option>
            <option value="digital">Digital</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Track Inventory</label>
          <select
            value={form.track_inventory}
            onChange={(event) => setForm({ ...form, track_inventory: event.target.value })}
            className="input"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Low Stock Alert</label>
          <input
            type="number"
            min="0"
            value={form.low_stock_alert}
            onChange={(event) => setForm({ ...form, low_stock_alert: event.target.value })}
            className="input"
            placeholder="10"
          />
        </div>
      </div>

      <ModalActions tone="violet" preset="form">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={modal.requestClose}
          disabled={createMutation.isPending}
          data-modal-dismiss="true"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving product...' : 'Save product'}
        </Button>
      </ModalActions>
    </form>
  );
}
