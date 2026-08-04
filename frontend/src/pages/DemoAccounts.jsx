import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { BrandIntro, BrandTopbar, PublicBulletList, PublicCard, PublicFeaturePanel, PublicInsetPanel, PublicMetricChip, PublicShell, PublicStage, PublicValuePill, ResponsiveCardGrid } from '../components/PageShell';
import ThemeToggle from '../components/ThemeToggle';
import { businessTypeGroups, businessTypes } from '../config/businessTypes';
import { useAuthStore } from '../stores/authStore';
import { resolvePostLoginPath } from '../lib/businessSession';

const demoAccounts = [
  { type: 'retail', label: 'Retail Shop', email: 'retail@taska.local' },
  { type: 'supermarket', label: 'Supermarket', email: 'supermarket@taska.local' },
  { type: 'pharmacy', label: 'Pharmacy', email: 'pharmacy@taska.local' },
  { type: 'agro_dealer', label: 'Agro Dealer', email: 'agro@taska.local' },
  { type: 'restaurant', label: 'Restaurant', email: 'restaurant@taska.local' },
  { type: 'hotel', label: 'Hotel', email: 'hotel@taska.local' },
  { type: 'clinic', label: 'Clinic', email: 'clinic@taska.local' },
  { type: 'laboratory', label: 'Laboratory', email: 'lab@taska.local' },
  { type: 'logistics', label: 'Logistics', email: 'logistics@taska.local' },
  { type: 'delivery_company', label: 'Delivery Company', email: 'delivery@taska.local' },
  { type: 'warehouse', label: 'Warehouse', email: 'warehouse@taska.local' },
  { type: 'wholesale', label: 'Distributor / Wholesale', email: 'wholesale@taska.local' },
  { type: 'commodity', label: 'Commodity Business', email: 'commodity@taska.local' },
  { type: 'textile', label: 'Textile Business', email: 'textile@taska.local' },
  { type: 'pure_water_factory', label: 'Pure Water Factory', email: 'purewaterfactory@taska.local' },
  { type: 'livestock', label: 'Livestock Farm', email: 'livestock@taska.local' },
  { type: 'farm', label: 'Farm', email: 'farm@taska.local' },
  { type: 'service', label: 'Service Business', email: 'service@taska.local' },
  { type: 'mobile_agent', label: 'Mobile Agent', email: 'mobile@taska.local' },
  { type: 'school', label: 'School / Training Centre', email: 'school@taska.local' },
  { type: 'construction', label: 'Building Materials', email: 'construction@taska.local' },
  { type: 'fuel_business', label: 'Fuel Business', email: 'fuel@taska.local' },
  { type: 'beauty', label: 'Beauty / Salon', email: 'beauty@taska.local' },
  { type: 'mixed', label: 'Mixed Business', email: 'mixed@taska.local' },
  { type: 'general', label: 'General SME', email: 'general@taska.local' },
  { type: 'pure_water_retail', label: 'Pure Water Retail', email: 'purewaterretail@taska.local' },
];

export default function DemoAccounts() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [busyEmail, setBusyEmail] = useState('');
  const [error, setError] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const visibleAccounts = demoAccounts.filter((account) => {
    const config = businessTypes[account.type];
    const matchesGroup = group === 'all' || config?.group === group;
    const haystack = [
      account.label,
      account.email,
      config?.name,
      config?.description,
    ].join(' ').toLowerCase();

    return matchesGroup && (!normalizedSearch || haystack.includes(normalizedSearch));
  });

  const handleQuickLogin = async (account) => {
    setBusyEmail(account.email);
    setError('');

    try {
      const data = await login(account.email, 'password123');
      navigate(resolvePostLoginPath(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign into this demo account right now.');
    } finally {
      setBusyEmail('');
    }
  };

  return (
    <PublicShell className="py-6 lg:py-8">
      <div className="ambient-orb left-[8%] top-10 h-56 w-56 bg-violet-500/20" />
      <div className="ambient-orb alt bottom-12 right-[8%] h-72 w-72 bg-sky-400/12" />

      <PublicStage>
        <PublicFeaturePanel>
          <BrandTopbar
            className="gap-6"
            brand={(
              <BrandIntro className="max-w-3xl">
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.26em] text-violet-600">Deployment demo access</p>
                <h1 className="mt-3 text-[clamp(2.05rem,1.05vw+1.55rem,2.65rem)] font-extrabold text-[var(--color-text)]">Demo accounts for every Taska business type</h1>
                <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                  Every demo business now has a clean one-word email, the same password, and seeded operating data so the experience feels real during product walkthroughs.
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                  Use quick sign-in to jump straight into a live workspace with the right dashboard, modules, seeded records, and AI summaries already waiting.
                </p>
              </BrandIntro>
            )}
            actions={(
              <>
                <ThemeToggle />
                <Button as={Link} to="/login" variant="secondary">
                  Sign in
                </Button>
              </>
            )}
          />

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <PublicCard className="rounded-[1.5rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Demo login standard</p>
              <PublicBulletList
                className="mt-4 space-y-3"
                itemClassName="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3"
                items={[
                  'All business demos use the same password for easy handoff',
                  'Every account is seeded with customers, orders, expenses, stock, and AI signals',
                  'Emails are simple one-word aliases at taska.local for faster walkthroughs',
                ]}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PublicMetricChip className="rounded-xl px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Password</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-[var(--color-text)]">password123</p>
                </PublicMetricChip>
                <PublicMetricChip className="rounded-xl px-4 py-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Coverage</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{demoAccounts.length} business types</p>
                </PublicMetricChip>
              </div>

              <PublicInsetPanel className="mt-5 rounded-[1.2rem] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Fastest demo path</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                  Search for a business type, click <span className="font-semibold text-[var(--color-text)]">Open demo</span>, and Taska will sign you in with the seeded account automatically.
                </p>
              </PublicInsetPanel>
            </PublicCard>

            <PublicCard className="rounded-[1.5rem] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {demoAccounts.slice(0, 6).map((account) => {
                  const config = businessTypes[account.type];

                  return (
                    <div key={account.type} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--panel-strong)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${config?.color ?? '#7C3AED'}15`, color: config?.color ?? '#7C3AED' }}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={config?.icon} />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--color-text)]">{account.label}</p>
                          <PublicValuePill mono className="mt-2 truncate rounded-xl px-3 py-2 text-xs">
                            {account.email}
                          </PublicValuePill>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PublicCard>
          </div>

          <PublicCard className="mt-7 rounded-[1.5rem] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">Demo browser</p>
                <h2 className="mt-2 text-[clamp(1.5rem,0.6vw+1.3rem,1.9rem)] font-extrabold text-[var(--color-text)]">Find a business type and open it instantly</h2>
              </div>
              <div className="w-full xl:max-w-sm">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search retail, clinic, factory, logistics..."
                  className="input"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroup('all')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${group === 'all' ? 'bg-violet-600 text-white shadow-[0_14px_28px_rgba(124,58,237,0.26)]' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
              >
                All {demoAccounts.length}
              </button>
              {Object.entries(businessTypeGroups).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGroup(key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${group === key ? 'bg-violet-600 text-white shadow-[0_14px_28px_rgba(124,58,237,0.26)]' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
                >
                  {value.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
              <p>{visibleAccounts.length} demo workspace{visibleAccounts.length === 1 ? '' : 's'} visible</p>
              <p>Password: <span className="font-mono font-semibold text-[var(--color-text)]">password123</span></p>
            </div>
          </PublicCard>

          <ResponsiveCardGrid variant="cards" className="mt-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleAccounts.map((account) => {
              const config = businessTypes[account.type];
              const isBusy = busyEmail === account.email;

              return (
                <PublicCard
                  key={account.type}
                  className="rounded-[1.4rem] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                      style={{ backgroundColor: `${config?.color ?? '#7C3AED'}15`, color: config?.color ?? '#7C3AED' }}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={config?.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{account.label}</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{config?.description}</p>
                      <PublicValuePill mono className="mt-3 truncate rounded-xl px-3 py-2 text-xs">
                        {account.email}
                      </PublicValuePill>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-4 text-xs">
                    <div>
                      <p className="text-[var(--color-text-faint)]">Password</p>
                      <PublicValuePill mono className="mt-1 rounded-lg px-2 py-1">password123</PublicValuePill>
                    </div>
                    <div>
                      <p className="text-[var(--color-text-faint)]">Business Type</p>
                      <PublicValuePill className="mt-1 rounded-lg px-2 py-1">{config?.name ?? account.label}</PublicValuePill>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Button
                      type="button"
                      onClick={() => handleQuickLogin(account)}
                      disabled={isLoading || isBusy}
                      fullWidth
                      className="flex-1 bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]"
                    >
                      {isBusy ? 'Opening demo...' : 'Open demo'}
                    </Button>
                    <Button
                      as={Link}
                      to={`/login?email=${encodeURIComponent(account.email)}&demo=1`}
                      variant="secondary"
                    >
                      Manual
                    </Button>
                  </div>
                </PublicCard>
              );
            })}
          </ResponsiveCardGrid>

          {!visibleAccounts.length ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-8 text-center">
              <p className="text-lg font-semibold text-[var(--color-text)]">No demo accounts match that filter yet.</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Try another business name, or switch back to the full demo workspace view.</p>
            </div>
          ) : null}
        </PublicFeaturePanel>
      </PublicStage>
    </PublicShell>
  );
}
