import { Link } from 'react-router-dom';
import { DemoCheckList, DemoClosingCta, DemoDarkFooter, DemoHeroSection, DemoIndustryIntro, DemoMetricTiles, DemoNav, DemoPainPointsSection, DemoSectionIntro, DemoSocialProof, PublicShell, PublicStage } from '../components/PageShell';

const demoPages = {
  'pure-water': {
    industry: 'Pure Water',
    color: '#06B6D4',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5M8 13l2 3h3m-3 0l2-3h3m-3 0l2 3h3m-3 0l2-3',
    features: ['Bottle tracking', 'Production log', 'Route management', 'Customer accounts', 'Delivery scheduling', 'Payment tracking'],
    painPoints: [
      { title: 'Lost Bottles', desc: 'No tracking for returned bottles', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5M8 13l2 3h3m-3 0l2-3h3m-3 0l2 3h3m-3 0l2-3' },
      { title: 'Production Chaos', desc: 'Manual tracking causing delays', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Debtors', desc: 'Unpaid deliveries piling up', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
      { title: 'Route Confusion', desc: 'Missed deliveries and wrong addresses', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    ],
  },
  clinic: {
    industry: 'Clinic',
    color: '#EF4444',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    features: ['Patient records', 'Appointment booking', 'Consultation notes', 'Prescription writing', 'Billing and invoicing', 'Lab requests'],
    painPoints: [
      { title: 'Lost Files', desc: 'Paper records getting lost or damaged', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { title: 'Missed Appointments', desc: 'No reminder system for appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { title: 'Billing Errors', desc: 'Manual billing leads to mistakes', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
      { title: 'No History', desc: 'Cannot access previous visit data', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  lab: {
    industry: 'Diagnostic Lab',
    color: '#8B5CF6',
    icon: 'M9 3v2m6-2v2M9 3h6m-6 0H3m6 6h6m-6 0H3m6 6V9m0 6V3m0 6h6m-6 0h6m-6 0H3m6 6V3',
    features: ['Sample tracking', 'Result management', 'Patient portal', 'Payment integration', 'Quality control', 'Report generation'],
    painPoints: [
      { title: 'Lost Samples', desc: 'Mix-ups and mislabeled samples', icon: 'M9 3v2m6-2v2M9 3h6m-6 0H3m6 6h6m-6 0H3m6 6V9m0 6V3m0 6h6m-6 0h6m-6 0H3m6 6V3' },
      { title: 'Delayed Results', desc: 'Manual process causing backlogs', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Payment Confusion', desc: 'Unclear payment tracking', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
      { title: 'Compliance Issues', desc: 'Lack of audit trails and quality controls', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    ],
  },
  hotel: {
    industry: 'Hotel',
    color: '#3B82F6',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    features: ['Room booking', 'Guest management', 'Check-in and check-out', 'Bill generation', 'Housekeeping', 'Restaurant billing'],
    painPoints: [
      { title: 'Overbooking', desc: 'Double bookings and conflicts', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { title: 'Lost Bookings', desc: 'No digital record of reservations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { title: 'Slow Checkout', desc: 'Manual billing causing queues', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
      { title: 'Revenue Leaks', desc: 'Untracked extras and charges', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
    ],
  },
  farm: {
    industry: 'Farm / Poultry',
    color: '#84CC16',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    features: ['Flock tracking', 'Feeding schedules', 'Production logs', 'Mortality records', 'Sales tracking', 'Financial reports'],
    painPoints: [
      { title: 'Bird Loss', desc: 'No systematic mortality tracking', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z' },
      { title: 'Feed Waste', desc: 'Manual feeding causing waste', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Production Loss', desc: 'Untracked eggs and output', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
      { title: 'No Insights', desc: 'Cannot measure farm performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  general: {
    industry: 'General Business',
    color: '#64748B',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    features: ['Point of Sale', 'Inventory Tracking', 'Customer Database', 'Sales Reports', 'Expense Management', 'Multi-user Access'],
    painPoints: [
      { title: 'Manual Tracking', desc: 'Paper-based sales and inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { title: 'Data Loss', desc: 'No backup or digital records', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z' },
      { title: 'Poor Insights', desc: 'No real-time business data', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { title: 'Pricing Errors', desc: 'Manual pricing causing losses', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2' },
    ],
  },
};

export default function DemoGeneral() {
  const config = demoPages.general;
  return <DemoPage config={config} slug="general" />;
}

export function DemoPureWater() {
  const config = demoPages['pure-water'];
  return <DemoPage config={config} slug="pure-water" />;
}

export function DemoClinic() {
  const config = demoPages.clinic;
  return <DemoPage config={config} slug="clinic" />;
}

export function DemoLab() {
  const config = demoPages.lab;
  return <DemoPage config={config} slug="lab" />;
}

export function DemoHotel() {
  const config = demoPages.hotel;
  return <DemoPage config={config} slug="hotel" />;
}

export function DemoFarm() {
  const config = demoPages.farm;
  return <DemoPage config={config} slug="farm" />;
}

function DemoPage({ config, slug }) {
  const { industry, color, features, painPoints, icon } = config;

  return (
    <PublicShell>
      <DemoNav primaryTo={`/register?business_type=${slug}`} />

      <DemoHeroSection>
        <DemoIndustryIntro
          color={color}
          badgeIcon={icon}
          badgeLabel={`${industry} Demo`}
          title={<>Run your <span style={{ color }}>{industry}</span> with confidence</>}
          description={`Taska helps ${industry.toLowerCase()} businesses across Africa manage their operations efficiently with tools built specifically for their workflow.`}
          ctaLink={`/register?business_type=${slug}`}
        />
        <div className="public-card-strong rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">{industry} Dashboard</h3>
          <DemoMetricTiles
            items={[
              { label: 'Today', value: 'Active' },
              { label: 'Revenue', value: 'Tracking' },
              { label: 'Status', value: 'Online' },
              { label: 'Version', value: '2.0' },
            ]}
            gridClassName="mb-6"
            valueStyle={() => ({ color })}
          />
          <DemoCheckList
            items={features.slice(0, 3)}
            className="space-y-3"
            itemClassName="flex items-center gap-2"
            iconContainerClassName=""
            iconClassName="h-5 w-5 text-emerald-500"
          />
        </div>
      </DemoHeroSection>

      <DemoPainPointsSection
        title={`Problems Taska solves for ${industry} businesses`}
        painPoints={painPoints}
      />

      <section className="py-16">
        <PublicStage>
          <DemoSectionIntro title="What you get with Taska" className="mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}><svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg></div>
                <span className="font-medium text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </PublicStage>
      </section>

      <DemoSocialProof
        color={color}
        heading={`Trusted by ${industry} businesses across Nigeria`}
        labels={[`${industry} businesses`, 'Transactions', 'Uptime']}
      />

      <DemoClosingCta
        title={`Ready to transform your ${industry} business?`}
        description={`Join hundreds of ${industry.toLowerCase()} businesses already using Taska.`}
        primaryTo={`/register?business_type=${slug}`}
      />

      <DemoDarkFooter />
    </PublicShell>
  );
}
