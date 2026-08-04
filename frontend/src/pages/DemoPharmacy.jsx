import { Link } from 'react-router-dom';
import { DemoDarkFooter, DemoFeatureShowcase, DemoHeroSection, DemoIndustryIntro, DemoNav, DemoPainPointsSection, DemoPreviewWindow, DemoSocialProof, PublicShell } from '../components/PageShell';

const features = [
  'Real-time inventory tracking',
  'Expiry date alerts',
  'Prescription management',
  'Customer purchase history',
  'Multi-branch support',
  'Financial reports',
];

const painPoints = [
  {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z',
    title: 'Expired medicines',
    desc: 'Lost revenue from stock that should have been flagged earlier.',
  },
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    title: 'Manual records',
    desc: 'Hours lost to paper-based inventory and prescription logs.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Lost customers',
    desc: 'Returning patients disappear when there is no purchase history.',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2',
    title: 'Pricing errors',
    desc: 'Inconsistent prices quietly erode pharmacy margins.',
  },
];

export default function DemoPharmacy() {
  return (
    <DemoLayout
      industry="Pharmacy"
      color="#10B981"
      painPoints={painPoints}
      features={features}
      ctaLink="/register?business_type=pharmacy"
    />
  );
}

function DemoLayout({ industry, color, painPoints, features, ctaLink }) {
  const stats = [
    { label: "Today's Sales", value: 'NGN 156,000' },
    { label: 'Prescriptions', value: '23' },
    { label: 'Low Stock', value: '5' },
    { label: 'Expiring Soon', value: '3' },
  ];
  const recentPrescriptions = [
    { name: 'Amoxicillin 500mg', qty: 2, patient: 'John D.' },
    { name: 'Paracetamol', qty: 5, patient: 'Sarah M.' },
    { name: 'Ciprofloxacin', qty: 1, patient: 'Mike R.' },
  ];

  return (
    <PublicShell>
      <DemoNav />

      <DemoHeroSection>
        <DemoIndustryIntro
          color={color}
          badgeIcon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5M8 13l2 3h3m-3 0l2-3h3m-3 0l2 3h3m-3 0l2-3"
          badgeLabel={`${industry} Demo`}
          title={<>Run your <span style={{ color }}>{industry}</span> with confidence</>}
          description="Taska helps pharmacies across Africa track inventory, manage customers, and protect profits with tools built for regulated day-to-day pharmacy work."
          ctaLink={ctaLink}
        />

        <DemoPreviewWindow
          color={color}
          stats={stats}
          listTitle="Recent Prescriptions"
          items={recentPrescriptions}
          renderItem={(item, index, itemColor) => (
            <div key={`${item.name}-${index}`} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">{item.patient}</p>
              </div>
              <span className="text-sm font-medium" style={{ color: itemColor }}>
                x{item.qty}
              </span>
            </div>
          )}
        />
      </DemoHeroSection>

      <DemoPainPointsSection
        title="Stop losing money to these problems"
        description="See how Taska solves your biggest challenges"
        painPoints={painPoints}
      />

      <DemoFeatureShowcase
        color={color}
        features={features}
        title="Everything you need to run your pharmacy"
        panelTitle="Key capabilities"
        itemTone="Built specifically for pharmacy workflows"
      />

      <DemoSocialProof
        color={color}
        heading="Trusted by pharmacies across Nigeria"
        labels={['Pharmacies', 'Transactions', 'Uptime']}
      />

      <DemoDarkFooter />
    </PublicShell>
  );
}

