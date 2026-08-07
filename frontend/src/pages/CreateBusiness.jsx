import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { AuthShell, BrandIntro, BrandTopbar, ContentGrid, FormPanel, PageHeader, PageShell } from '../components/PageShell';
import api from '../lib/api';
import { businessTypeGroups, businessTypes, canonicalizeBusinessType, getBusinessTypeConfig } from '../config/businessTypes';
import { useAuthStore } from '../stores/authStore';
import { logoPropPresets } from '../components/logoConfig.js';

const groupedBusinessTypes = Object.entries(businessTypeGroups).map(([groupKey, group]) => ({
  key: groupKey,
  name: group.name,
  types: group.types.map((typeKey) => businessTypes[typeKey]).filter(Boolean),
}));

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 md:flex-row md:items-center md:justify-between">
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
  );
}

export default function CreateBusiness() {
  const navigate = useNavigate();
  const { createBusiness, isLoading } = useAuthStore();
  const [expandedGroup, setExpandedGroup] = useState('commerce');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    business_type: 'retail',
    business_category: 'commerce',
    business_location: '',
    primary_branch_name: 'Main Branch',
    contact_phone: '',
    logo_url: '',
    subscription_plan_id: '',
    billing_cycle: 'monthly',
  });

  const plansQuery = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const response = await api.get('/billing/plans');
      return response.data?.data ?? [];
    },
  });

  const selectedType = useMemo(() => getBusinessTypeConfig(form.business_type), [form.business_type]);
  const plans = plansQuery.data || [];
  const isFormComplete = useMemo(() => (
    form.business_name.trim()
    && form.primary_branch_name.trim()
    && form.business_location.trim()
    && form.contact_phone.trim()
    && form.business_type
  ), [form]);

  const handleTypeChange = (typeId) => {
    const canonicalType = canonicalizeBusinessType(typeId);
    const typeConfig = getBusinessTypeConfig(canonicalType);
    setForm((current) => ({
      ...current,
      business_type: canonicalType,
      business_category: typeConfig?.group ?? 'other',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await createBusiness({
        ...form,
        logo_url: form.logo_url || null,
        subscription_plan_id: form.subscription_plan_id ? Number(form.subscription_plan_id) : null,
      });
      navigate('/');
    } catch (submitError) {
      setError(submitError.response?.data?.message ?? 'Unable to create business right now.');
    }
  };

  return (
    <AuthShell>
      <PageShell width="auth" className="page-stack">
        <BrandTopbar
          brand={(
            <BrandIntro>
              <PageHeader
                eyebrow="New business workspace"
                title="Create a new business workspace"
                description="Create the business, default branch, owner role, module profile, and subscription context in one clean setup flow."
              />
            </BrandIntro>
          )}
        />

        <QueryErrorPanel
          message={plansQuery.isError ? 'We could not load subscription plans right now. Please try again.' : ''}
          onRetry={() => {
            void plansQuery.refetch();
          }}
        />

        <ContentGrid as="form" onSubmit={handleSubmit} columns="sidebar" className="xl:grid-cols-[minmax(0,1.45fr)_20rem]">
          <section className="space-y-5">
            <FormPanel>
              <div className="mb-5 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text)]">What happens next</p>
                <div className="mt-2 grid gap-2 text-sm text-[var(--color-text-muted)] md:grid-cols-3">
                  <p>Owner role and workspace permissions are created automatically.</p>
                  <p>Your dashboard and modules switch to the new business immediately after setup.</p>
                  <p>Offline queue, AI insights, and reporting context will follow this workspace.</p>
                </div>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Business identity</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="input-label">Business name</span>
                  <input value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} className="input" placeholder="Result Seekers Hotel" required />
                </label>
                <label className="block">
                  <span className="input-label">Primary branch name</span>
                  <input value={form.primary_branch_name} onChange={(event) => setForm({ ...form, primary_branch_name: event.target.value })} className="input" placeholder="Head Office" required />
                </label>
                <label className="block">
                  <span className="input-label">Business location</span>
                  <input value={form.business_location} onChange={(event) => setForm({ ...form, business_location: event.target.value })} className="input" placeholder="Kaduna, Nigeria" required />
                </label>
                <label className="block">
                  <span className="input-label">Contact phone</span>
                  <input value={form.contact_phone} onChange={(event) => setForm({ ...form, contact_phone: event.target.value })} className="input" placeholder="+234 801 234 5678" required />
                </label>
                <label className="block md:col-span-2">
                  <span className="input-label">Logo URL (optional)</span>
                  <input value={form.logo_url} onChange={(event) => setForm({ ...form, logo_url: event.target.value })} className="input" placeholder="https://example.com/logo.png" />
                </label>
              </div>
            </FormPanel>

            <FormPanel>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Business type</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">Choose the workflow engine Taska should activate for this business.</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-[var(--color-brand)] ring-1 ring-violet-200">
                  Category: {form.business_category}
                </span>
              </div>

              <div className="mt-5 space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {groupedBusinessTypes.map((group) => (
                  <div key={group.key} className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
                    <button
                      type="button"
                      onClick={() => setExpandedGroup(expandedGroup === group.key ? null : group.key)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left"
                    >
                      <span className="text-sm font-semibold text-[var(--color-text)]">{group.name}</span>
                      <span className="text-[var(--color-text-muted)]">{expandedGroup === group.key ? '-' : '+'}</span>
                    </button>

                    {expandedGroup === group.key ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {group.types.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleTypeChange(type.id)}
                            className={`flex min-h-[72px] items-start justify-between gap-3 rounded-[14px] border p-4 text-left transition ${
                              form.business_type === type.id
                                ? 'border-violet-300 bg-violet-50 shadow-[var(--shadow-sm)]'
                                : 'border-[var(--color-border)] bg-white hover:border-violet-200 hover:bg-violet-50/40'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text)]">{type.name}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{type.description}</p>
                            </div>
                            {form.business_type === type.id ? (
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Selected</span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </FormPanel>

            <FormPanel>
              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isLoading || !isFormComplete}
                className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]"
              >
                {isLoading ? 'Creating business workspace...' : 'Create business workspace'}
              </Button>
              {error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </FormPanel>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <FormPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Subscription</p>
              <label className="mt-4 block">
                <span className="input-label">Plan</span>
                <select
                  value={form.subscription_plan_id}
                  onChange={(event) => setForm({ ...form, subscription_plan_id: event.target.value })}
                  className="input"
                  disabled={plansQuery.isLoading}
                >
                  <option value="">Start with free trial</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="input-label">Billing cycle</span>
                <select value={form.billing_cycle} onChange={(event) => setForm({ ...form, billing_cycle: event.target.value })} className="input">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>

              <Button as={Link} to="/business-select" variant="ghost" className="mt-5 justify-start px-0 text-[var(--color-brand)] hover:bg-transparent hover:text-[var(--color-brand-strong)]">
                Back to business selection
              </Button>
            </FormPanel>

            <FormPanel>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Preview</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1rem] bg-[var(--color-brand-soft)] text-xl font-semibold text-[var(--color-brand)]">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt={form.business_name} className="h-full w-full object-cover" />
                  ) : (
                    form.business_name?.charAt(0) || 'T'
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">{form.business_name || 'Your next business'}</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">{selectedType.name}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1rem] border border-violet-100 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f3ff_46%,#f4f8ff_100%)] px-4 py-4 text-center">
                <Logo
                  {...logoPropPresets.previewCenter}
                  decorative
                />
              </div>

              <div className="mt-5 space-y-3 text-sm text-[var(--color-text-muted)]">
                <p>Taska will automatically create the owner role, default branch, active modules, subscription context, and offline business scope.</p>
                <p>Your switcher, dashboard, permissions, and AI insights will update immediately after creation.</p>
              </div>
            </FormPanel>
          </aside>
        </ContentGrid>
      </PageShell>
    </AuthShell>
  );
}
