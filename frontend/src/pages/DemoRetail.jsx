import { Link } from 'react-router-dom';
import { DemoClosingCta, DemoDarkFooter, DemoFeatureShowcase, DemoHeroSection, DemoIndustryIntro, DemoNav, DemoPainPointsSection, DemoPreviewWindow, DemoSocialProof, PublicShell } from '../components/PageShell';

const features = [
  'Point of Sale (POS)',
  'Barcode scanning',
  'Inventory management',
  'Customer database',
  'Sales reports',
  'Multi-user access',
];

const painPoints = [
  {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    title: 'Manual sales tracking',
    desc: 'Paper receipts and error-prone calculations slow down the shop floor.',
  },
  {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z',
    title: 'Stock outs',
    desc: 'Popular items disappear before the team spots the gap.',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2',
    title: 'Pricing errors',
    desc: 'Inconsistent pricing creates avoidable revenue leakage.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'No customer history',
    desc: 'Repeat customers leave little trace when sales are not linked to profiles.',
  },
];

export default function DemoRetail() {
  return (
    <DemoLayout
      industry="Retail Shop"
      color="#EC4899"
      painPoints={painPoints}
      features={features}
      ctaLink="/register?business_type=retail"
    />
  );
}

function DemoLayout({ industry, color, painPoints, features, ctaLink }) {
  const stats = [
    { label: "Today's Sales", value: 'NGN 84,500' },
    { label: 'Transactions', value: '47' },
    { label: 'Customers', value: '156' },
    { label: 'Items Sold', value: '234' },
  ];
  const topProducts = [
    { name: 'Detergent 500ml', qty: 24, price: 'NGN 12,000' },
    { name: 'Biscuits Cream', qty: 18, price: 'NGN 9,000' },
    { name: 'Milo 400g', qty: 15, price: 'NGN 7,500' },
  ];

  return (
    <PublicShell>
      <DemoNav />

      <DemoHeroSection>
        <DemoIndustryIntro
          color={color}
          badgeIcon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          badgeLabel={`${industry} Demo`}
          title={<>Run your <span style={{ color }}>{industry}</span> smarter</>}
          description="Taska helps retail shops track sales, manage inventory, and grow customers with a practical POS workflow built for African businesses."
          ctaLink={ctaLink}
        />

        <DemoPreviewWindow
          color={color}
          stats={stats}
          listTitle="Top Products Today"
          items={topProducts}
          renderItem={(item, index, itemColor) => (
            <div key={`${item.name}-${index}`} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">x{item.qty}</p>
              </div>
              <span className="font-medium" style={{ color: itemColor }}>
                {item.price}
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
        title="Everything you need to run your shop"
        panelTitle="Why Taska for retail?"
        itemTone="Built for retail workflows"
      />

      <DemoSocialProof
        color={color}
        heading="Trusted by 500+ shops across Nigeria"
        labels={['Shops', 'Transactions', 'Uptime']}
      />

      <DemoClosingCta
        title="Ready to transform your shop?"
        description="Join hundreds of shops already using Taska to grow their business."
        primaryTo={ctaLink}
      />

      <DemoDarkFooter />
    </PublicShell>
  );
}

