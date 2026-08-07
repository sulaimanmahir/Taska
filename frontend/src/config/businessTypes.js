export const businessTypeGroups = {
  commerce: {
    name: 'Commerce',
    types: ['retail', 'supermarket', 'wholesale', 'commodity', 'pharmacy', 'textile', 'construction', 'fuel_business', 'pure_water_retail']
  },
  manufacturing: {
    name: 'Manufacturing',
    types: ['pure_water_factory', 'grain_milling']
  },
  services: {
    name: 'Services',
    types: ['restaurant', 'hotel', 'clinic', 'laboratory', 'service', 'school', 'beauty']
  },
  agriculture: {
    name: 'Agriculture',
    types: ['farm', 'livestock', 'agro_dealer']
  },
  mobility: {
    name: 'Mobility',
    types: ['logistics', 'delivery_company', 'mobile_agent']
  },
  other: {
    name: 'Other',
    types: ['warehouse', 'general', 'mixed']
  }
};

export const businessTypes = {
  retail: {
    id: 'retail',
    name: 'Retail / Shop / Kiosk',
    slug: 'retail',
    group: 'commerce',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    color: '#EC4899',
    description: 'Retail shop, kiosk, and general storefront operations',
  },
  supermarket: {
    id: 'supermarket',
    name: 'Supermarket',
    slug: 'supermarket',
    group: 'commerce',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    color: '#A855F7',
    description: 'Supermarket & barcode retail',
  },
  wholesale: {
    id: 'wholesale',
    name: 'Distributor / Wholesale',
    slug: 'wholesale',
    group: 'commerce',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    color: '#8B5CF6',
    description: 'Distributor, bulk stock, and wholesale customer operations',
  },
  commodity: {
    id: 'commodity',
    name: 'Commodity Business',
    slug: 'commodity',
    group: 'commerce',
    icon: 'M4 7h16M4 12h16M4 17h10m4-12v14m-8-9v9m-6-6v6',
    color: '#B45309',
    description: 'Commodity lots, market pricing, moisture control and settlements',
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacy',
    slug: 'pharmacy',
    group: 'commerce',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5M8 13l2 3h3m-3 0l2-3h3m-3 0l2 3h3m-3 0l2-3',
    color: '#10B981',
    description: 'Pharmacy & Medical Store',
  },
  textile: {
    id: 'textile',
    name: 'Textile / Fashion / Kwari Market',
    slug: 'textile',
    group: 'commerce',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    color: '#F59E0B',
    description: 'Textile, fabrics, fashion, and market stall operations',
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    slug: 'restaurant',
    group: 'commerce',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#EF4444',
    description: 'Restaurant and food service operations',
  },
  hotel: {
    id: 'hotel',
    name: 'Hotel / Guest House',
    slug: 'hotel',
    group: 'services',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    color: '#3B82F6',
    description: 'Hotel, guest house, lodging, and hospitality operations',
  },
  clinic: {
    id: 'clinic',
    name: 'Clinic / Health Facility',
    slug: 'clinic',
    group: 'services',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#EF4444',
    description: 'Clinic, outpatient care, consultation, and treatment operations',
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics Company',
    slug: 'logistics',
    group: 'mobility',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    color: '#06B6D4',
    description: 'Fleet scheduling, trip sheets, fuel settlements and transport profitability',
  },
  delivery_company: {
    id: 'delivery_company',
    name: 'Delivery Company / Courier',
    slug: 'delivery_company',
    group: 'mobility',
    icon: 'M8 7h8m0 0l-3-3m3 3l-3 3m4 5h2l2 3h2m-12 0h8m-8 0a2 2 0 11-4 0m4 0a2 2 0 104 0',
    color: '#7C3AED',
    description: 'Courier, parcel movement, COD, and rider payout operations',
  },
  laboratory: {
    id: 'laboratory',
    name: 'Laboratory / Diagnostic Centre',
    slug: 'laboratory',
    group: 'services',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5',
    color: '#14B8A6',
    description: 'Diagnostics, samples, results, and lab billing operations',
  },
  agro_dealer: {
    id: 'agro_dealer',
    name: 'Agro Dealer',
    slug: 'agro_dealer',
    group: 'agriculture',
    icon: 'M7 20h10M12 4v16m0 0c-3.5 0-6-2.5-6-6 0-2.5 1.5-4.5 4-6 1-.6 2-1.5 2-4 0 2.5 1 3.4 2 4 2.5 1.5 4 3.5 4 6 0 3.5-2.5 6-6 6z',
    color: '#65A30D',
    description: 'Seeds, chemicals, fertilizer and seasonal stock',
  },
  pure_water_factory: {
    id: 'pure_water_factory',
    name: 'Pure Water Factory',
    slug: 'pure_water_factory',
    group: 'manufacturing',
    icon: 'M12 3C9 7 7 10 7 13a5 5 0 0010 0c0-3-2-6-5-10zM8 19h8',
    color: '#0EA5E9',
    description: 'Production, packaging, dispatch and costing',
  },
  pure_water_retail: {
    id: 'pure_water_retail',
    name: 'Pure Water Retail',
    slug: 'pure_water_retail',
    group: 'commerce',
    icon: 'M12 3C9 7 7 10 7 13a5 5 0 0010 0c0-3-2-6-5-10zM6 20h12',
    color: '#0284C7',
    description: 'Sachet, bottle, crate and wholesale water retail operations',
  },
  grain_milling: {
    id: 'grain_milling',
    name: 'Grain Milling / Processing',
    slug: 'grain_milling',
    group: 'manufacturing',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l2 3H9m2 3l2 3H7.5a2 2 0 01-2-2V3.5M8 13l2 3h3m-3 0l2-3h3m-3 0l2 3h3m-3 0l2-3',
    color: '#B45309',
    description: 'Grain intake, milling batches, yield and byproduct tracking',
  },
  livestock: {
    id: 'livestock',
    name: 'Livestock Farm',
    slug: 'livestock',
    group: 'agriculture',
    icon: 'M4 15c2-2 4-3 8-3s6 1 8 3v3H4v-3zm3-5a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z',
    color: '#D97706',
    description: 'Animal groups, feed, health, breeding, and mortality operations',
  },
  service: {
    id: 'service',
    name: 'Service Business',
    slug: 'service',
    group: 'services',
    icon: 'M11 17a1 1 0 102 0v-5a1 1 0 10-2 0v5zm-7 4h16a1 1 0 001-1V8a1 1 0 00-.553-.894l-8-4a1 1 0 00-.894 0l-8 4A1 1 0 003 8v12a1 1 0 001 1z',
    color: '#F97316',
    description: 'Bookings, jobs, invoices and staff assignments',
  },
  mobile_agent: {
    id: 'mobile_agent',
    name: 'Mobile Agent / POS Business',
    slug: 'mobile_agent',
    group: 'mobility',
    icon: 'M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2zm5 13h.01',
    color: '#2563EB',
    description: 'Transfers, liquidity, commissions, settlement, and agent cash control',
  },
  construction: {
    id: 'construction',
    name: 'Building Materials Business',
    slug: 'construction',
    group: 'commerce',
    icon: 'M10 3H5a2 2 0 00-2 2v5m15 1V7a2 2 0 00-2-2h-5m0 0v16m0-16L3 13m9-8l9 8',
    color: '#F59E0B',
    description: 'Cement, rods, roofing, site delivery, contractor pricing, and yard operations',
  },
  fuel_business: {
    id: 'fuel_business',
    name: 'Fuel / Energy Business',
    slug: 'fuel_business',
    group: 'commerce',
    icon: 'M10 2h4v4h2a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h2V2zm-1 9h6',
    color: '#DC2626',
    description: 'Tank stock, pump attendants, shift reconciliation, and energy retail',
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty / Salon / Barbing',
    slug: 'beauty',
    group: 'services',
    icon: 'M9 3h6l1 5-4 4v9h-2v-9L6 8l3-5z',
    color: '#DB2777',
    description: 'Appointments, services, products used, commissions, and salon floor control',
  },
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    slug: 'warehouse',
    group: 'other',
    icon: 'M4 7l8-4 8 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 8h8',
    color: '#0891B2',
    description: 'Warehouse stock, request intake, releases, and accountability operations',
  },
  ngo_warehouse: {
    id: 'ngo_warehouse',
    name: 'Warehouse',
    slug: 'ngo_warehouse',
    group: 'other',
    icon: 'M4 7l8-4 8 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 8h8',
    color: '#0891B2',
    description: 'Warehouse stock, request intake, releases, and accountability operations',
    hidden: true,
  },
  school: {
    id: 'school',
    name: 'School / Training Centre',
    slug: 'school',
    group: 'services',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
    color: '#8B5CF6',
    description: 'School, academy, and training centre operations',
  },
  farm: {
    id: 'farm',
    name: 'Crop Farming / Agribusiness',
    slug: 'farm',
    group: 'agriculture',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#84CC16',
    description: 'Crop farming, agribusiness, and seasonal field operations',
  },
  general: {
    id: 'general',
    name: 'General SME',
    slug: 'general',
    group: 'other',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: '#64748B',
    description: 'General SME operations across sales, stock, and owner oversight',
  },
  mixed: {
    id: 'mixed',
    name: 'Mixed Business',
    slug: 'mixed',
    group: 'other',
    icon: 'M4 6h16M4 12h16M4 18h10m-7-9l3 3-3 3m10-6l3 3-3 3',
    color: '#475569',
    description: 'Mixed trade, cash control, collections and owner operations',
  },
};

export const defaultBusinessType = 'general';
export const businessTypeAliases = {
  ngo_warehouse: 'warehouse',
};

export function canonicalizeBusinessType(type) {
  return businessTypeAliases[type] || type || defaultBusinessType;
}

export function isVisibleBusinessType(type) {
  const canonicalType = canonicalizeBusinessType(type);
  const config = businessTypes[canonicalType];
  return Boolean(config && !config.hidden);
}

export function getBusinessTypeConfig(type) {
  const canonicalType = canonicalizeBusinessType(type);
  return businessTypes[canonicalType] || businessTypes[defaultBusinessType];
}

export function getBusinessTypeBySlug(slug) {
  const match = Object.values(businessTypes).find((businessType) => businessType.slug === slug);
  return getBusinessTypeConfig(match?.id);
}

export function getBusinessTypesByGroup(group) {
  return Object.values(businessTypes).filter((businessType) => businessType.group === group && !businessType.hidden);
}
