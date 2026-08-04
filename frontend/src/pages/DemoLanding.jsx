import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { logoPropPresets } from '../components/logoConfig.js';
import { DemoClosingCta, DemoLightFooter, DemoNav, DemoSectionIntro, PublicShell, PublicStage } from '../components/PageShell';

const industries = [
  {
    id: 'retail',
    name: 'Retail Shop',
    label: 'Retail',
    color: '#EC4899',
    painPoints: ['Manual sales tracking', 'Stock outs', 'Pricing errors'],
    features: ['Smart POS', 'Low stock alerts', 'Sales reports'],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    label: 'Pharmacy',
    color: '#10B981',
    painPoints: ['Expiry alerts', 'Prescription logs', 'Batch visibility'],
    features: ['Expiry alerts', 'Rx management', 'Batch tracking'],
  },
  {
    id: 'supermarket',
    name: 'Supermarket',
    label: 'Supermarket',
    color: '#F59E0B',
    painPoints: ['Large catalog', 'Barcode mismatch', 'Shrinkage'],
    features: ['Barcode checkout', 'Category management', 'Loss reports'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    label: 'Restaurant',
    color: '#EF4444',
    painPoints: ['Order delays', 'Menu changes', 'Tip splitting'],
    features: ['Kitchen display', 'Table tracking', 'Menu builder'],
  },
  {
    id: 'hotel',
    name: 'Hotel',
    label: 'Hospitality',
    color: '#3B82F6',
    painPoints: ['Booking conflicts', 'Slow check-in', 'Revenue leaks'],
    features: ['Booking system', 'Room status', 'Guest profiles'],
  },
  {
    id: 'clinic',
    name: 'Clinic',
    label: 'Clinic',
    color: '#06B6D4',
    painPoints: ['Scattered records', 'Appointment overlap', 'Billing mistakes'],
    features: ['Patient records', 'Appointments', 'Billing'],
  },
  {
    id: 'school',
    name: 'School',
    label: 'Education',
    color: '#8B5CF6',
    painPoints: ['Fee tracking', 'Attendance chaos', 'Report preparation'],
    features: ['Student records', 'Fee tracking', 'Attendance'],
  },
  {
    id: 'pure_water_factory',
    routePath: '/demo/pure-water',
    name: 'Pure Water Factory',
    label: 'Manufacturing-lite',
    color: '#0EA5E9',
    painPoints: ['Production visibility', 'Input control', 'Delivery gaps'],
    features: ['Production log', 'Seal inventory', 'Delivery tracking'],
  },
];

export default function DemoLanding() {
  return (
    <PublicShell>
      <DemoNav secondaryTo="/pricing" secondaryLabel="Pricing" />

      <section className="relative overflow-hidden pb-16 pt-20">
        <div className="absolute left-12 top-12 h-72 w-72 rounded-full bg-[#6D28D9]/5 blur-3xl" />
        <PublicStage className="relative">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Explore Taska by business type
              </div>
              <h1 className="mb-5 text-[clamp(2.2rem,1.5vw+1.5rem,3.15rem)] font-extrabold tracking-tight text-slate-900">
                See how Taska fits real business workflows
              </h1>
              <p className="mb-7 max-w-2xl text-base leading-7 text-slate-600">
                One operating system for POS, inventory, customers, reports, operations, and AI guidance across shops, pharmacies, clinics, hotels, schools, logistics, and manufacturing-lite businesses.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]"
                >
                  Start Free Trial
                </Link>
                <a
                  href="#industries"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Browse Demos
                </a>
              </div>
            </div>

            <div className="public-card-strong rounded-2xl p-6">
              <Logo
                {...logoPropPresets.showcaseCenter}
                decorative
                signatureText="Guided by business type"
              />
              <p className="text-sm font-semibold text-slate-900">What the demo library gives you</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Explore industry-specific workflows before account setup, then move straight into the right business type with a cleaner onboarding path.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'Industries', value: '8+' },
                  { label: 'Live modules', value: '26 business types' },
                  { label: 'Setup path', value: 'Seeded demo accounts' },
                  { label: 'Best for', value: 'SME operations' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PublicStage>
      </section>

      <section id="industries" className="border-t border-slate-200 bg-white py-16">
        <PublicStage>
          <DemoSectionIntro
            title="Choose your industry"
            description="Each demo focuses on the day-to-day problems that matter in that business model."
            action={(
              <Link to="/demo" className="text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-strong)]">
                Open demo account list
              </Link>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {industries.map((industry) => (
              <Link
                key={industry.id}
                to={industry.routePath ?? `/demo/${industry.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: `${industry.color}12`, color: industry.color }}>
                  {industry.label}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{industry.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {industry.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="mt-5 space-y-2">
                  {industry.painPoints.map((pain) => (
                    <p key={pain} className="text-sm text-slate-600">
                      {pain}
                    </p>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: industry.color }}>
                  View demo
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </PublicStage>
      </section>

      <DemoClosingCta
        contained
        title="Ready to move from demo to live workspace?"
        description="Start with the right business type, then continue into Taska's live modules, dashboards, and AI guidance without changing the core workflow."
        primaryTo="/register"
        primaryLabel="Create Business Account"
        secondaryTo="/demo/accounts"
        secondaryLabel="Use Demo Accounts"
      />

      <DemoLightFooter />
    </PublicShell>
  );
}
