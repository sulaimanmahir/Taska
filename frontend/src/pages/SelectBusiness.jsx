import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { AuthShell, BrandIntro, BrandTopbar, ContentGrid, FormPanel, PageHeader, PageShell, PublicMetricChip } from '../components/PageShell';
import { useAuthStore } from '../stores/authStore';
import { getBusinessTypeConfig } from '../config/businessTypes';

export default function SelectBusiness() {
  const navigate = useNavigate();
  const { businesses, switchBusiness, user, business: activeBusiness } = useAuthStore();
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const visibleBusinesses = [...businesses]
    .sort((a, b) => {
      if (a.id === activeBusiness?.id) return -1;
      if (b.id === activeBusiness?.id) return 1;
      return (a.name ?? '').localeCompare(b.name ?? '');
    })
    .filter((business) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        business.name,
        business.business_type_label,
        business.subscription_plan,
        business.location,
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedSearch);
    });

  const handleSelect = async (businessId) => {
    setBusyId(businessId);

    try {
      await switchBusiness(businessId);
      navigate('/');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AuthShell>
      <PageShell width="auth" className="page-stack">
        <BrandTopbar
          brand={(
            <BrandIntro className="flex-1">
              <PageHeader
                eyebrow="Business workspace"
                title="Choose your workspace"
                description={`${user?.name ? `${user.name}, your account is linked to multiple businesses.` : 'Your account is linked to multiple businesses.'} Choose one to load the correct modules, dashboard, permissions, AI guidance, and offline queue context.`}
              />
            </BrandIntro>
          )}
        />

        <ContentGrid columns="sidebar" className="xl:grid-cols-[minmax(0,1fr)_18.75rem]">
          <section className="space-y-5">
            <FormPanel>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Workspace browser</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    Search by business name, type, plan, or location. Your current workspace stays pinned to the top.
                  </p>
                </div>
                <div className="w-full lg:max-w-sm">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search business, type, or location..."
                    className="input"
                  />
                </div>
              </div>
            </FormPanel>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PublicMetricChip className="rounded-[18px] px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Businesses</p>
                <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{businesses.length}</p>
              </PublicMetricChip>
              <PublicMetricChip className="rounded-[18px] px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Visible</p>
                <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{visibleBusinesses.length}</p>
              </PublicMetricChip>
              <PublicMetricChip className="rounded-[18px] px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Current</p>
                <p className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">{activeBusiness?.business_type_label ?? 'None'}</p>
              </PublicMetricChip>
            </div>

            {visibleBusinesses.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleBusinesses.map((business) => {
                  const typeConfig = getBusinessTypeConfig(business.business_type);
                  const isCurrent = business.id === activeBusiness?.id;

                  return (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => handleSelect(business.id)}
                      className="group rounded-[20px] border border-[var(--color-border)] bg-white p-6 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-brand-soft)] text-lg font-semibold text-[var(--color-brand)]">
                            {business.logo_url ? (
                              <img src={business.logo_url} alt={business.name} className="h-full w-full object-cover" />
                            ) : (
                              business.name?.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-[var(--color-text)]">{business.name}</p>
                            <p className="text-sm text-[var(--color-text-muted)]">{business.business_type_label}</p>
                            {isCurrent ? (
                              <p className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-[var(--color-brand)] ring-1 ring-violet-200">
                                Current workspace
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {business.subscription_status?.replace('_', ' ') ?? 'active'}
                        </span>
                      </div>

                      <div className="mt-6 space-y-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">Your role</span>
                          <span className="font-semibold text-[var(--color-text)]">{business.role_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">Branches</span>
                          <span className="font-semibold text-[var(--color-text)]">{business.branch_count ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">Plan</span>
                          <span className="font-semibold text-[var(--color-text)]">{business.subscription_plan ?? 'Trial'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">Location</span>
                          <span className="max-w-[60%] truncate font-semibold text-[var(--color-text)]">{business.location ?? 'Nigeria'}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm text-[var(--color-text-muted)]">{busyId === business.id ? 'Loading business context...' : typeConfig.name}</span>
                        <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-[var(--color-brand)]">
                          {busyId === business.id ? 'Please wait' : isCurrent ? 'Re-open workspace' : 'Open workspace'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[20px] border border-dashed border-[var(--color-border-strong)] bg-white px-6 py-8 text-center shadow-[var(--shadow-sm)]">
                <div className="max-w-md">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-text)]">No businesses found</p>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    Create your first business workspace to begin using Taska.
                  </p>
                  <Button as={Link} to="/businesses/new" size="lg" className="mt-6 bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]">
                    Create business
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <FormPanel className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">Create another business</p>
              <h2 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Add another business</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                Launch a new company, depot, school, clinic, cooperative, or branch network without creating another login.
              </p>
              <Button as={Link} to="/businesses/new" size="lg" fullWidth className="mt-6 bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]">
                Create business
              </Button>
            </FormPanel>

            <FormPanel className="bg-[var(--color-bg-subtle)] p-6">
              <p className="text-sm font-semibold text-[var(--color-text)]">Selected workspace</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {activeBusiness?.name
                  ? `${activeBusiness.name} is currently active.`
                  : 'Choose a business to load the correct modules, dashboard, and permissions.'}
              </p>
            </FormPanel>
          </aside>
        </ContentGrid>
      </PageShell>
    </AuthShell>
  );
}
