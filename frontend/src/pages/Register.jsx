import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell, BrandIntro, BrandTopbar, FormPanel, PageHeader, PageShell } from '../components/PageShell';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/Button';
import { useAuthStore } from '../stores/authStore';
import { businessTypeGroups, businessTypes, canonicalizeBusinessType, isVisibleBusinessType } from '../config/businessTypes';

const groupedBusinessTypes = Object.entries(businessTypeGroups).map(([groupKey, group]) => ({
  key: groupKey,
  name: group.name,
  types: group.types.map((typeKey) => businessTypes[typeKey]).filter(Boolean),
}));

const roles = [
  { value: 'admin', label: 'Business Owner', desc: 'Full workspace control, billing, branches, and AI decisions.' },
  { value: 'manager', label: 'Manager', desc: 'Run operations, staff, and daily reporting with limited admin tasks.' },
  { value: 'cashier', label: 'Cashier', desc: 'Focus on sales, collections, and front-desk workflows.' },
  { value: 'staff', label: 'Staff', desc: 'Secure task-level access for guided daily operations.' },
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [searchParams] = useSearchParams();
  const prefilledType = isVisibleBusinessType(searchParams.get('business_type'))
    ? canonicalizeBusinessType(searchParams.get('business_type'))
    : 'retail';
  const [expandedGroup, setExpandedGroup] = useState(() => businessTypes[prefilledType]?.group || 'commerce');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
    business_type: prefilledType,
    role: 'admin',
  });
  const [error, setError] = useState('');

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (prefilledType && isVisibleBusinessType(prefilledType)) {
      queueMicrotask(() => {
        setExpandedGroup(businessTypes[prefilledType].group || 'commerce');
      });
    }
  }, [prefilledType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <AuthShell>
      <div className="ambient-orb left-[8%] top-8 h-56 w-56 bg-violet-500/22" />
      <div className="ambient-orb alt bottom-6 right-[12%] h-72 w-72 bg-sky-400/14" />

      <PageShell width="auth" className="page-stack">
        <BrandTopbar
          className="mb-5"
          brand={(
            <BrandIntro contentClassName="mt-4">
              <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
                Create your first business workspace or launch a new company on the same account later.
              </p>
            </BrandIntro>
          )}
          actions={<ThemeToggle />}
        />

        <div className="mb-6 flex items-center justify-center gap-3 xl:mb-8">
          {[1, 2, 3].map((value) => (
            <div key={value} className="flex items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                step >= value
                  ? 'bg-[var(--color-brand)] text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]'
                  : 'border border-[var(--color-border)] bg-[var(--panel-strong)] text-[var(--color-text-muted)]'
              }`}>
                {step > value ? 'OK' : value}
              </div>
              {value < 3 ? (
                <div className={`mx-2 h-1 w-12 rounded-full ${step > value ? 'bg-violet-500' : 'bg-[var(--color-border)]'}`} />
              ) : null}
            </div>
          ))}
        </div>

        <FormPanel as="form" onSubmit={handleSubmit} className="public-card-strong mx-auto w-full max-w-4xl p-6 sm:p-7 lg:p-8">
          {step === 1 ? (
            <div className="animate-fade-in">
              <PageHeader
                eyebrow="Step 1"
                title="Create your account"
                description="Taska is built for multi-branch, multi-business, offline-first African operations. Let's start with the account owner."
                className="mb-7"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="input-label">Your full name</span>
                  <input type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Aisha Musa" className="input" required />
                </label>
                <label className="block">
                  <span className="input-label">Email address</span>
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="owner@business.com" className="input" required />
                </label>
                <label className="block">
                  <span className="input-label">Phone</span>
                  <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+234 801 234 5678" className="input" />
                </label>
                <label className="block md:col-span-2">
                  <span className="input-label">Password</span>
                  <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} placeholder="********" className="input" required />
                </label>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                fullWidth
                size="lg"
                className="mt-7"
              >
                Continue to role selection
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="animate-fade-in">
              <PageHeader
                eyebrow="Step 2"
                title="Choose your role"
                description="Permissions stay business-specific, so this is just the starting role for your first workspace."
                className="mb-7"
              />

              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`rounded-[1.1rem] border p-5 text-left ${
                      form.role === role.value
                        ? 'border-violet-300 bg-violet-50 shadow-[var(--shadow-sm)]'
                        : 'border-[var(--color-border)] bg-[var(--panel-strong)] hover:border-violet-200'
                    }`}
                  >
                    <p className="text-base font-semibold text-[var(--color-text)]">{role.label}</p>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{role.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-7 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  size="lg"
                  className="flex-1"
                >
                  Continue to business setup
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="animate-fade-in">
              <PageHeader
                eyebrow="Step 3"
                title="Create your business"
                description="Pick the business profile Taska should activate so your menus, reports, AI signals, and workflows feel purpose-built from day one."
                className="mb-7"
              />

              <div className="space-y-4">
                <label className="block">
                  <span className="input-label">Business name</span>
                  <input type="text" value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} placeholder="Taska Pharmacy Kaduna" className="input" required />
                </label>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="input-label !mb-0">Business type</span>
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700">
                      {businessTypes[form.business_type]?.name ?? 'Retail Shop'}
                    </span>
                  </div>
                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {groupedBusinessTypes.map((group) => (
                      <div key={group.key} className="rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--panel-strong)] p-3">
                        <button type="button" onClick={() => setExpandedGroup(expandedGroup === group.key ? null : group.key)} className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left">
                          <span className="text-sm font-semibold text-[var(--color-text)]">{group.name}</span>
                          <span className="text-[var(--color-text-muted)]">{expandedGroup === group.key ? '-' : '+'}</span>
                        </button>
                        {expandedGroup === group.key ? (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {group.types.map((type) => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => setForm({ ...form, business_type: type.id })}
                                className={`rounded-[1rem] border p-3.5 text-left ${
                                  form.business_type === type.id
                                    ? 'border-violet-300 bg-violet-50 shadow-[var(--shadow-sm)]'
                                    : 'border-[var(--color-border)] hover:border-violet-200 hover:bg-violet-50/40'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">{type.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{type.description}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <div className="mt-7 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="flex-1"
                >
                  {isLoading ? 'Creating workspace...' : 'Create business workspace'}
                </Button>
              </div>
            </div>
          ) : null}
        </FormPanel>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">
            Sign in
          </Link>
        </p>
      </PageShell>
    </AuthShell>
  );
}
