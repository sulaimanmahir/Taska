import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { PublicBulletList, PublicMetricChip, PublicShell, PublicStage } from '../components/PageShell';
import { logoPropPresets } from '../components/logoConfig.js';
import ThemeToggle from '../components/ThemeToggle';

const highlights = [
  'Offline-first operations for unstable internet and power environments',
  'Industry-specific dashboards for retail, hotel, clinic, school, delivery, fuel, pharmacy, and more',
  'AI command center that explains what happened, why it matters, and what to do next',
];

const valuePillars = [
  { label: 'Built for your business', sub: 'Industry-aware workflows' },
  { label: 'Smarter operations', sub: 'Actionable AI and forecasting' },
  { label: 'Secure and reliable', sub: 'Tenant-scoped, role-based access' },
  { label: 'Real-time insights', sub: 'Command-center dashboards' },
];

const modules = [
  'Retail and Supermarket',
  'Pharmacy and Clinic',
  'Hotel and Restaurant',
  'School and Training',
  'Delivery and Logistics',
  'Fuel and Building Materials',
  'Pure Water Factory',
  'Textile, Agro, Livestock',
];

export default function Landing() {
  return (
    <PublicShell>
      <div className="ambient-orb left-[6%] top-10 h-56 w-56 bg-violet-500/20" />
      <div className="ambient-orb alt right-[8%] top-24 h-72 w-72 bg-sky-400/12" />

      <nav className="public-nav sticky top-0 z-40">
        <PublicStage className="flex items-center justify-between py-3.5">
          <Link to="/" aria-label="Taska home" className="flex items-center">
            <Logo
              {...logoPropPresets.landingNav}
            />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#why" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Why Taska</a>
            <a href="#modules" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Modules</a>
            <a href="#pricing" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="hidden text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] sm:inline-flex">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-brand)] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:bg-[var(--color-brand-strong)]"
            >
              Start free
            </Link>
          </div>
        </PublicStage>
      </nav>

      <section className="relative pb-14 pt-12 lg:pb-16 lg:pt-14">
        <PublicStage className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr] xl:gap-12">
          <div>
            <div className="public-pill is-brand">
              Every Business Starts Free
            </div>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.3rem,1.9vw+1.35rem,3.45rem)] font-extrabold leading-[0.96] text-[var(--color-text)]">
              The premium African business operating system for the realities on the ground.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--color-text-muted)] md:text-base">
              Taska combines Stripe-grade elegance, offline resilience, and industry-aware workflows for Nigerian and African businesses that need to move fast, stay controlled, and look world-class doing it.
            </p>

            <PublicBulletList
              className="mt-7 space-y-3"
              itemClassName="public-card flex items-start gap-3 rounded-2xl px-4 py-3"
              markerClassName="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-[10px] font-bold uppercase text-violet-700"
              markerContent="OK"
              items={highlights}
              renderText={(item) => <p className="text-sm text-[var(--color-text-soft)]">{item}</p>}
            />

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(124,58,237,0.22)] transition hover:bg-[var(--color-brand-strong)]"
              >
                Create business account
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--panel-strong)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                Sign in to workspace
              </Link>
              <Link
                to="/demo"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--panel-strong)] px-5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                Explore 26 live demos
              </Link>
            </div>
          </div>

          <div className="public-card-strong rounded-[1.7rem] p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
              <div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Made for the realities here</p>
                <PublicBulletList
                  className="mt-4 space-y-3"
                  items={[
                    'Works for unstable internet, field teams, and multi-branch businesses',
                    'Activates industry-aware modules instead of generic admin screens',
                    'Turns business signals into clear owner actions every day',
                  ]}
                />
              </div>

              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-violet-100 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f3ff_42%,#eef6ff_100%)] px-6 py-8">
                <div className="pointer-events-none absolute inset-x-6 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(124,58,237,0.26),transparent)]" />
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-violet-300/18 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-sky-300/16 blur-3xl" />
                <div className="relative text-center">
                  <div className="inline-flex rounded-full border border-violet-200/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 shadow-[0_14px_30px_rgba(124,58,237,0.08)] backdrop-blur">
                    Premium ERP Identity
                  </div>
                  <Logo
                    {...logoPropPresets.landingHero}
                    decorative
                  />
                  <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">
                    A premium operating system for African retail, service, health, logistics, education, and production businesses.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { metric: '26', label: 'Business profiles live' },
                { metric: 'Offline', label: 'Sell and sync later' },
                { metric: 'AI', label: 'Daily action center' },
                { metric: 'Multi', label: 'Business switching built in' },
                ].map((item) => (
                  <PublicMetricChip key={item.label} className="rounded-[1.1rem] px-4 py-3.5">
                    <p className="text-2xl font-black text-[var(--color-text)]">{item.metric}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.label}</p>
                  </PublicMetricChip>
                ))}
            </div>
          </div>
        </PublicStage>
      </section>

      <section id="why" className="border-y border-[var(--color-border)] bg-[#fbfcff] py-8">
        <PublicStage className="grid gap-4 md:grid-cols-4">
          {valuePillars.map((item) => (
            <div key={item.label} className="public-card rounded-[1.2rem] px-5 py-5">
              <p className="text-base font-bold text-[var(--color-text)]">{item.label}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.sub}</p>
            </div>
          ))}
        </PublicStage>
      </section>

      <section id="modules" className="py-14">
        <PublicStage>
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">Industry realism</p>
            <h2 className="mt-3 text-[clamp(1.95rem,1vw+1.45rem,2.45rem)] font-extrabold text-[var(--color-text)]">Taska adapts to the business you actually run.</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Not generic retail software. Taska activates dedicated modules, reports, alerts, pricing logic, and dashboards based on the business type you choose.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <div key={module} className="public-card rounded-[1.2rem] px-5 py-5">
                <p className="text-lg font-bold text-[var(--color-text)]">{module}</p>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">Purpose-built dashboards, controls, and operating workflows.</p>
              </div>
            ))}
          </div>
        </PublicStage>
      </section>

      <section id="pricing" className="pb-16">
        <PublicStage>
        <div className="public-card-strong mx-auto max-w-5xl rounded-[1.8rem] p-8 lg:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">Simple pricing</p>
            <h2 className="mt-3 text-[clamp(1.95rem,1vw+1.45rem,2.45rem)] font-extrabold text-[var(--color-text)]">Start free. Upgrade when your operations demand more.</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">No messy setup. No throwaway demo feel. Real ERP depth from day one.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { name: 'Starter', price: 'Free', note: 'Perfect for getting live fast', featured: false },
              { name: 'Growth', price: 'N9,900', note: 'AI, more staff, more control', featured: true },
              { name: 'Enterprise', price: 'Custom', note: 'For large multi-branch operations', featured: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-[1.3rem] border p-6 ${plan.featured ? 'border-violet-300 bg-violet-50 shadow-[0_16px_36px_rgba(124,58,237,0.12)]' : 'border-[var(--color-border)] bg-[var(--color-bg-subtle)]'}`}>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">{plan.name}</p>
                <p className="mt-4 text-4xl font-black text-[var(--color-text)]">{plan.price}</p>
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">{plan.note}</p>
                <Link to="/register" className={`mt-6 inline-flex h-11 w-full justify-center rounded-xl px-5 text-sm font-semibold ${plan.featured ? 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)]' : 'border border-[var(--color-border)] bg-[var(--panel-strong)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]'}`}>
                  Start free
                </Link>
              </div>
            ))}
          </div>
        </div>
        </PublicStage>
      </section>
    </PublicShell>
  );
}
