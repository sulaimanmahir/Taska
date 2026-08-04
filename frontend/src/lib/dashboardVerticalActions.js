export function getDashboardVerticalActions(businessType) {
  const actionMap = {
    delivery_company: [
      { label: 'Open deliveries', to: '/deliveries', tone: 'sky' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    logistics: [
      { label: 'Open logistics', to: '/logistics', tone: 'sky' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    retail: [
      { label: 'Open sales', to: '/pos', tone: 'violet' },
      { label: 'Open stock', to: '/inventory', tone: 'sky' },
    ],
    supermarket: [
      { label: 'Open sales', to: '/pos', tone: 'violet' },
      { label: 'Open stock', to: '/inventory', tone: 'sky' },
    ],
    wholesale: [
      { label: 'Open wholesale desk', to: '/wholesale', tone: 'violet' },
      { label: 'Open transfers', to: '/transfers', tone: 'sky' },
    ],
    pure_water_factory: [
      { label: 'Open production', to: '/production', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    pure_water_retail: [
      { label: 'Open water retail', to: '/pure-water-retail', tone: 'violet' },
      { label: 'Open deliveries', to: '/deliveries', tone: 'sky' },
    ],
    farm: [
      { label: 'Open farm ops', to: '/farm', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    school: [
      { label: 'Open students', to: '/students', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    pharmacy: [
      { label: 'Open pharmacy', to: '/pharmacy', tone: 'violet' },
      { label: 'Open stock', to: '/inventory', tone: 'sky' },
    ],
    restaurant: [
      { label: 'Open restaurant', to: '/restaurant', tone: 'violet' },
      { label: 'Open kitchen', to: '/kitchen', tone: 'amber' },
    ],
    mobile_agent: [
      { label: 'Open agent desk', to: '/mobile-agent', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    textile: [
      { label: 'Open textile ops', to: '/variants', tone: 'violet' },
      { label: 'Open debtors', to: '/debtors', tone: 'amber' },
    ],
    fuel_business: [
      { label: 'Open fuel ops', to: '/fuel', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    agro_dealer: [
      { label: 'Open agro ops', to: '/agro', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    construction: [
      { label: 'Open quotations', to: '/quotations', tone: 'violet' },
      { label: 'Open yard stock', to: '/yard-stock', tone: 'sky' },
    ],
    commodity: [
      { label: 'Open commodity desk', to: '/commodity', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    beauty: [
      { label: 'Open appointments', to: '/appointments', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    service: [
      { label: 'Open appointments', to: '/appointments', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    mixed: [
      { label: 'Open sales', to: '/pos', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    general: [
      { label: 'Open sales', to: '/pos', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    warehouse: [
      { label: 'Open warehouse', to: '/warehouse', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
    livestock: [
      { label: 'Open livestock', to: '/livestock', tone: 'violet' },
      { label: 'Open reports', to: '/reports', tone: 'slate' },
    ],
  };

  const aliases = {
    ngo_warehouse: 'warehouse',
  };

  return actionMap[businessType] || actionMap[aliases[businessType]] || [];
}
