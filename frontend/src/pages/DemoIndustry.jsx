import { Link } from 'react-router-dom';
import { DemoClosingCta, DemoHeroSection, DemoLightFooter, DemoMetricTiles, DemoNav, DemoSectionIntro, DemoSocialProof, PublicShell, PublicStage } from '../components/PageShell';

const industryConfig = {
  retail: {
    id: 'retail',
    name: 'Retail Shop',
    label: 'Retail',
    color: '#EC4899',
    painPoints: [
      { title: 'Manual tracking', desc: 'Paper-based sales logging is error-prone and slow.' },
      { title: 'Stock outs', desc: 'Popular items run out before anyone notices.' },
      { title: 'Pricing errors', desc: 'Missed price updates quietly reduce margin.' },
    ],
    features: [
      { name: 'Smart POS', desc: 'Fast checkout with barcode support.' },
      { name: 'Low stock alerts', desc: 'Know what to reorder before shelves go empty.' },
      { name: 'Quick price lookup', desc: 'Find pricing instantly at the counter.' },
      { name: 'Sales reports', desc: 'Daily, weekly, and monthly visibility.' },
      { name: 'Customer history', desc: 'Track repeat buyers and sales patterns.' },
    ],
    stats: [
      { value: '3.2s', label: 'Avg transaction time' },
      { value: '94%', label: 'Stock accuracy' },
      { value: 'NGN 2.4M', label: 'Avg daily sales' },
    ],
    testimonial: {
      name: 'Chidi Okafor',
      business: 'City Mall, Lagos',
      quote: 'Taska reduced our checkout time by 60% and gave us cleaner daily visibility.',
    },
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacy',
    label: 'Pharmacy',
    color: '#10B981',
    painPoints: [
      { title: 'Expiry risk', desc: 'Missing expiry dates creates losses and compliance exposure.' },
      { title: 'Prescription logs', desc: 'Manual records are slow and hard to review.' },
      { title: 'Batch visibility', desc: 'Supplier lots are difficult to trace when stock moves fast.' },
    ],
    features: [
      { name: 'Expiry alerts', desc: 'Flag products before they become a loss.' },
      { name: 'Rx management', desc: 'Keep digital prescription and dispense history.' },
      { name: 'Batch tracking', desc: 'Trace lots from supplier to sale.' },
      { name: 'Drug inventory', desc: 'Organize stock by category and strength.' },
      { name: 'Supplier ordering', desc: 'Reorder faster when key products run low.' },
    ],
    stats: [
      { value: '100%', label: 'Expiry compliance' },
      { value: '48 hrs', label: 'Alert lead time' },
      { value: '5,000+', label: 'Drug products' },
    ],
    testimonial: {
      name: 'Dr. Ngozi Adeleke',
      business: 'HealthFirst Pharmacy, Abuja',
      quote: 'We stopped losing drugs to expiry and finally have one reliable stock picture.',
    },
  },
  supermarket: {
    id: 'supermarket',
    name: 'Supermarket',
    label: 'Supermarket',
    color: '#F59E0B',
    painPoints: [
      { title: 'Large catalog', desc: 'Thousands of SKUs become hard to control.' },
      { title: 'Barcode mismatches', desc: 'Checkout disputes grow when shelf and till prices differ.' },
      { title: 'Shrinkage', desc: 'Inventory discrepancies stay hidden too long.' },
    ],
    features: [
      { name: 'Barcode checkout', desc: 'Fast checkout with consistent pricing.' },
      { name: 'Category management', desc: 'Organize stock by aisle and department.' },
      { name: 'Loss reports', desc: 'Track shrinkage and stock variances.' },
      { name: 'Shelf tracking', desc: 'Know what is on the floor vs in the back room.' },
      { name: 'Multi-POS', desc: 'Run several checkout points with one view.' },
    ],
    stats: [
      { value: '10,000+', label: 'Max products' },
      { value: '15+', label: 'Checkout stations' },
      { value: '99.8%', label: 'Scan accuracy' },
    ],
    testimonial: {
      name: 'Emeka Nwosu',
      business: 'MegaMart, Port Harcourt',
      quote: 'Taska gave us control over 8,000 SKUs without the usual checkout confusion.',
    },
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    label: 'Restaurant',
    color: '#EF4444',
    painPoints: [
      { title: 'Order delays', desc: 'Rush-hour service breaks down without a kitchen flow.' },
      { title: 'Menu changes', desc: 'Daily specials are hard to push to staff quickly.' },
      { title: 'Staff payout friction', desc: 'Tips and shift performance become difficult to track.' },
    ],
    features: [
      { name: 'Order management', desc: 'Route orders from front desk to kitchen faster.' },
      { name: 'Table tracking', desc: 'See room and table status clearly.' },
      { name: 'Kitchen display', desc: 'Keep live ticket flow visible to the back of house.' },
      { name: 'Tip splitting', desc: 'Handle staff payout more consistently.' },
      { name: 'Menu builder', desc: 'Update menu items and prices without confusion.' },
    ],
    stats: [
      { value: '40%', label: 'Faster service' },
      { value: 'NGN 850K', label: 'Avg daily revenue' },
      { value: '4.5 min', label: 'Avg order time' },
    ],
    testimonial: {
      name: 'Tunde Bakare',
      business: 'Savannah Grill, Lagos',
      quote: 'Kitchen flow is cleaner and we are no longer losing tickets during peak periods.',
    },
  },
  hotel: {
    id: 'hotel',
    name: 'Hotel',
    label: 'Hospitality',
    color: '#3B82F6',
    painPoints: [
      { title: 'Booking conflicts', desc: 'Double bookings create avoidable guest frustration.' },
      { title: 'Slow check-in', desc: 'Manual guest registration slows front-desk service.' },
      { title: 'Revenue leaks', desc: 'Extras and room charges are easy to miss.' },
    ],
    features: [
      { name: 'Booking system', desc: 'Manage reservations with a live room view.' },
      { name: 'Room status', desc: 'Track occupied, cleaning, and available rooms clearly.' },
      { name: 'Guest profiles', desc: 'Keep history and preferences in one place.' },
      { name: 'Revenue reports', desc: 'See room, service, and extra income together.' },
      { name: 'Housekeeping', desc: 'Coordinate cleaning and room turnaround better.' },
    ],
    stats: [
      { value: '98%', label: 'Occupancy rate' },
      { value: '3 min', label: 'Check-in time' },
      { value: 'NGN 45K', label: 'Avg room rate' },
    ],
    testimonial: {
      name: 'Adaobi Chioke',
      business: 'Lagos Continental Hotel',
      quote: 'We finally have a booking flow that feels calm and professional at the front desk.',
    },
  },
  clinic: {
    id: 'clinic',
    name: 'Clinic',
    label: 'Clinic',
    color: '#06B6D4',
    painPoints: [
      { title: 'Scattered records', desc: 'Patient history is hard to review across visits.' },
      { title: 'Appointment overlap', desc: 'Scheduling errors waste time for staff and patients.' },
      { title: 'Billing mistakes', desc: 'Services are missed or billed inconsistently.' },
    ],
    features: [
      { name: 'Patient records', desc: 'Store visits, notes, and service history in one place.' },
      { name: 'Appointments', desc: 'Manage clinics and provider time with clearer scheduling.' },
      { name: 'Vitals tracking', desc: 'Capture and review key health indicators quickly.' },
      { name: 'Billing', desc: 'Bill by service without manual spreadsheet work.' },
      { name: 'Lab requests', desc: 'Keep test requests linked to patient records.' },
    ],
    stats: [
      { value: '1,200+', label: 'Patient records' },
      { value: '85%', label: 'No-show reduction' },
      { value: 'NGN 12K', label: 'Avg service bill' },
    ],
    testimonial: {
      name: 'Dr. Emeka Okonkwo',
      business: 'Prime Care Clinic, Lagos',
      quote: 'The clinic runs faster when patient history and billing are finally in one workflow.',
    },
  },
  school: {
    id: 'school',
    name: 'School / Training Centre',
    label: 'School',
    color: '#8B5CF6',
    painPoints: [
      { title: 'Fee tracking', desc: 'Manual payment records are hard to reconcile.' },
      { title: 'Attendance chaos', desc: 'Paper roll calls slow down the school day.' },
      { title: 'Report preparation', desc: 'Result and report generation takes too long.' },
    ],
    features: [
      { name: 'Student records', desc: 'Keep admissions and academic history together.' },
      { name: 'Fee tracking', desc: 'Track payment status clearly across students.' },
      { name: 'Attendance', desc: 'Capture class presence faster.' },
      { name: 'Report cards', desc: 'Prepare result summaries with less manual effort.' },
      { name: 'Class management', desc: 'Organize classes, subjects, and sessions cleanly.' },
    ],
    stats: [
      { value: '500+', label: 'Students' },
      { value: '98%', label: 'Fee collection' },
      { value: '2 min', label: 'Attendance time' },
    ],
    testimonial: {
      name: 'Mrs. Folake Adeyemi',
      business: 'Bright Stars Academy, Ibadan',
      quote: 'Fee follow-up and class administration are much easier for our team now.',
    },
  },
  pure_water_factory: {
    id: 'pure_water_factory',
    name: 'Pure Water Factory',
    label: 'Manufacturing-lite',
    color: '#0EA5E9',
    painPoints: [
      { title: 'Production visibility', desc: 'Daily output is hard to track accurately.' },
      { title: 'Input control', desc: 'Packaging and seal usage easily drift out of sync.' },
      { title: 'Delivery gaps', desc: 'Route stock and dispatch history get lost.' },
    ],
    features: [
      { name: 'Production log', desc: 'Track daily output and run history.' },
      { name: 'Seal inventory', desc: 'Monitor critical packaging materials.' },
      { name: 'Delivery tracking', desc: 'See what left the factory and where it went.' },
      { name: 'Stock reports', desc: 'Follow finished goods and raw materials clearly.' },
      { name: 'Expense tracking', desc: 'Watch production cost and margin movement.' },
    ],
    stats: [
      { value: '50,000', label: 'Sachets per day' },
      { value: 'NGN 180K', label: 'Daily revenue' },
      { value: '100%', label: 'Stock accuracy' },
    ],
    testimonial: {
      name: 'Ibrahim Musa',
      business: 'AquaPure Water, Kano',
      quote: 'Production and dispatch now feel like one connected operation instead of guesswork.',
    },
  },
};

export default function DemoIndustry({ industry }) {
  const config = industryConfig[industry] || industryConfig.retail;

  return (
    <PublicShell>
      <DemoNav
        brandHref="/demo"
        primaryTo={`/register?business_type=${config.id}`}
      />

      <DemoHeroSection
        gridClassName="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]"
        glowClassName="absolute left-10 top-16 h-72 w-72 rounded-full bg-[#6D28D9]/5 blur-3xl"
      >
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
            <span>{config.label}</span>
          </div>
          <h1 className="mb-5 text-[clamp(2.05rem,1.15vw+1.5rem,2.75rem)] font-extrabold text-slate-900">
            Taska for <span style={{ color: config.color }}>{config.name}</span>
          </h1>
          <p className="mb-7 max-w-2xl text-base leading-7 text-slate-600">
            Everything you need to run your {config.name.toLowerCase()} efficiently, from daily operations to visibility for the owner and team.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to={`/register?business_type=${config.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]"
            >
              Start Free Trial
            </Link>
            <Link
              to="/demo"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View All Industries
            </Link>
          </div>
        </div>

        <div className="public-card-strong rounded-2xl p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-900">{config.name} Snapshot</p>
            <p className="text-sm text-slate-500">A compact view of the workflow Taska helps you control.</p>
          </div>
          <DemoMetricTiles
            items={config.stats}
            columnsClassName="grid-cols-3"
            gridClassName="mb-5 gap-3"
            tileClassName="rounded-xl border border-slate-200 bg-slate-50 p-4"
            valueClassName="mt-1 text-lg font-bold text-slate-900"
          />
          <div className="space-y-3">
            {config.features.slice(0, 3).map((feature) => (
              <div key={feature.name} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{feature.name}</p>
                <p className="mt-1 text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </DemoHeroSection>

      <section className="border-y border-slate-200 bg-white py-12">
        <PublicStage>
          <DemoMetricTiles
            items={config.stats}
            columnsClassName="md:grid-cols-3"
            tileClassName="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            labelClassName="text-sm font-medium text-slate-500"
            valueClassName="mt-2 text-3xl font-bold text-slate-900"
          />
        </PublicStage>
      </section>

      <section className="py-16">
        <PublicStage>
          <DemoSectionIntro
            title="Problems Taska solves"
            description="Every one of these issues can quietly reduce growth if the team is working without a clear operating system."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {config.painPoints.map((pain) => (
              <div key={pain.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-base font-semibold text-slate-900">{pain.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{pain.desc}</p>
              </div>
            ))}
          </div>
        </PublicStage>
      </section>

      <section className="bg-white py-16">
        <PublicStage>
          <DemoSectionIntro
            title="Key features for this workflow"
            description="Built for everyday operational use, not just reporting after the fact."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {config.features.map((feature) => (
              <div key={feature.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="font-semibold text-slate-900">{feature.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </PublicStage>
      </section>

      <section className="py-16">
        <PublicStage>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-medium leading-8 text-slate-900">"{config.testimonial.quote}"</p>
              <p className="mt-6 font-semibold text-slate-900">{config.testimonial.name}</p>
              <p className="mt-1 text-sm text-slate-500">{config.testimonial.business}</p>
            </div>
          </div>
        </PublicStage>
      </section>

      <DemoSocialProof
        color={config.color}
        heading={`Trusted by ${config.name} teams across Nigeria`}
        labels={[config.label, 'Operational visibility', 'Uptime']}
        stats={config.stats.map((stat) => stat.value)}
      />

      <DemoClosingCta
        title="Ready to get started?"
        description={`See how Taska fits your ${config.name.toLowerCase()} before the next busy day catches your team unprepared.`}
        primaryTo={`/register?business_type=${config.id}`}
        primaryLabel={`Start Free Trial for ${config.name}`}
        secondaryTo="/demo"
        secondaryLabel="Explore Other Demos"
      />

      <DemoLightFooter />
    </PublicShell>
  );
}
