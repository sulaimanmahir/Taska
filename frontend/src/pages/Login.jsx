import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { logoPropPresets } from '../components/logoConfig.js';
import { AuthShell, BrandTopbar, ContentGrid, PageShell, PublicBulletList } from '../components/PageShell';
import { useAuthStore } from '../stores/authStore';
import { resolvePostLoginPath } from '../lib/businessSession';

export default function Login() {
  const [searchParams] = useSearchParams();
  const demoEmail = searchParams.get('email') ?? '';
  const isDemoMode = searchParams.get('demo') === '1';
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(isDemoMode ? 'password123' : '');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const data = await login(email, password);
      navigate(resolvePostLoginPath(data));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AuthShell>
      <div className="ambient-orb left-[8%] top-12 h-56 w-56 bg-violet-500/25" />
      <div className="ambient-orb alt bottom-10 right-[8%] h-72 w-72 bg-sky-400/15" />

      <PageShell width="auth" className="page-stack">
        <BrandTopbar
          className="auth-topbar"
          brand={(
            <Link to="/" aria-label="Taska home" className="inline-flex items-center">
              <Logo {...logoPropPresets.authHeader} />
            </Link>
          )}
        />

        <ContentGrid columns="sidebar" className="auth-login-grid">
          <section className="auth-login-hero auth-display-card border border-[var(--color-border)] bg-white shadow-[var(--shadow-md)]">
            <div>
              <div className="auth-login-hero-copy">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Premium business operating system</p>
                <h1 className="auth-hero-title">
                  Built for every African business that wants to run beautifully.
                </h1>
                <p className="auth-hero-description">
                  Taska brings AI-led decisions, offline resilience, multi-business control, and industry-aware workflows into one elegant operating system.
                </p>
              </div>
            </div>

            <div className="auth-display-panel">
              <div className="auth-feature-grid">
                <div className="auth-feature-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">Why teams switch</p>
                  <PublicBulletList
                    className="mt-3 space-y-3"
                    markerClassName="mt-1 h-2 w-2 rounded-full bg-violet-500"
                    items={[
                      'One login for every business and branch',
                      'Offline-ready operations for field and store teams',
                      'AI-led actions that explain what needs attention next',
                    ]}
                  />
                </div>

                <div className="auth-feature-card flex items-center justify-center text-center">
                  <div className="max-w-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">Built for real operations</p>
                    <Logo
                      {...logoPropPresets.showcaseCenter}
                      decorative
                    />
                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                      From retail and pharmacy to logistics, hospitality, production, and finance, Taska keeps teams aligned without losing elegance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="auth-feature-mini-grid">
                {[
                  { label: 'Offline-first', value: 'Always selling' },
                  { label: 'Multi-business', value: 'One secure login' },
                  { label: 'AI command center', value: 'Daily action lists' },
                ].map((item) => (
                  <div key={item.label} className="auth-feature-mini-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="auth-form-column">
            <section className="auth-form-panel auth-form-card public-card animate-slide-up mx-auto w-full rounded-[20px] p-5 sm:p-6 lg:p-7">
            <div className="mb-5 lg:hidden">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Premium business operating system</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">Welcome back</p>
              <h2 className="auth-form-heading mt-2 font-black text-[var(--color-text)]">Sign in to your workspace</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Continue into your active business, or choose between multiple businesses after login.
              </p>
            </div>

            {isDemoMode ? (
              <div className="mb-5 rounded-[16px] border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-[var(--color-text-soft)]">
                <p className="font-semibold text-violet-700">Demo sign-in ready</p>
                <p className="mt-2 leading-6">
                  This login was opened from the demo browser, so the seeded email and shared demo password are already filled in for you.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="auth-form-stack space-y-4">
              <label className="block">
                <span className="input-label">Email Address</span>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="input pl-12!"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="input-label">Password</span>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    className="input pl-12! pr-12!"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M10.477 10.482a3 3 0 004.24 4.24M9.88 9.88A3 3 0 0114.12 14.12M6.228 6.228A10.45 10.45 0 002.458 12C3.732 16.057 7.523 19 12 19a9.77 9.77 0 005.272-1.485M14.828 14.828A9.956 9.956 0 0021.542 12C20.268 7.943 16.477 5 12 5a9.77 9.77 0 00-1.95.192" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="auth-form-actions bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="auth-form-links">
              <Link to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password'} className="text-sm font-semibold text-violet-600 hover:text-violet-700">Forgot your password?</Link>
              <p className="text-sm text-[var(--color-text-muted)]">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-violet-600 hover:text-violet-700">
                  Create Business Account
                </Link>
              </p>
              <Link to="/demo" className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-faint)] hover:text-violet-600">
                Explore all business types &rarr;
              </Link>
            </div>
          </section>
          </div>
        </ContentGrid>
      </PageShell>
    </AuthShell>
  );
}
