import { formatCurrencyNGN } from './financeFormatters.js';

export function createLivestockFormState(fields = []) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? '']));
}

export function buildLivestockOverviewMetrics(stats = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Animals',
      value: stats.total_animals ?? 0,
      helper: 'Registered livestock currently tracked in the system.',
      tone: 'sky',
    },
    {
      label: 'Avg Weight (kg)',
      value: Number(stats.average_weight_kg ?? 0).toFixed(2),
      helper: 'Average recorded weight across active animal groups.',
      tone: 'emerald',
    },
    {
      label: 'Milk Today (L)',
      value: Number(stats.milk_today_litres ?? 0).toFixed(2),
      helper: "Milk production already logged in today's records.",
      tone: 'cyan',
    },
    {
      label: 'Open Outbreaks',
      value: stats.open_outbreaks ?? 0,
      helper: 'Disease alerts still needing containment or treatment action.',
      tone: 'rose',
    },
    {
      label: 'Pens',
      value: stats.pens ?? 0,
      helper: 'Pen spaces currently available across the livestock operation.',
      tone: 'violet',
    },
    {
      label: 'Medication Today',
      value: formatCurrency(stats.medication_cost_today ?? 0),
      helper: 'Same-day medication spend already recorded.',
      tone: 'amber',
    },
    {
      label: 'Sales Today',
      value: formatCurrency(stats.sales_today ?? 0),
      helper: 'Revenue captured from live sales and slaughter activity today.',
      tone: 'teal',
    },
    {
      label: 'Breeding Cycles Open',
      value: stats.breeding_cycles_open ?? 0,
      helper: 'Breeding programmes still active and requiring follow-up.',
      tone: 'indigo',
    },
  ];
}

export function buildLivestockDeskMetrics(stats = {}, groups = [], outbreaks = [], sales = [], formatCurrency = formatCurrencyNGN) {
  const activeGroups = groups.filter((group) => group.status !== 'closed' && group.status !== 'sold_out').length;
  const dairyGroups = groups.filter((group) => String(group.production_type || '').toLowerCase().includes('milk')).length;
  const criticalOutbreaks = outbreaks.filter((outbreak) => outbreak.status !== 'resolved' && String(outbreak.severity || '').toLowerCase() === 'high').length;
  const saleVolume = sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0);

  return [
    {
      label: 'Active Groups',
      value: activeGroups,
      helper: 'Animal groups still active across dairy, fattening, breeding, or nursery operations.',
      tone: 'sky',
    },
    {
      label: 'Dairy Groups',
      value: dairyGroups,
      helper: 'Groups likely contributing to milk output and daily production pressure.',
      tone: 'cyan',
    },
    {
      label: 'Critical Alerts',
      value: criticalOutbreaks,
      helper: 'High-severity disease alerts still needing urgent intervention.',
      tone: 'rose',
    },
    {
      label: 'Sale Volume',
      value: saleVolume,
      helper: 'Animals already moved through slaughter or live-sale transactions.',
      tone: 'emerald',
    },
    {
      label: 'Revenue Captured',
      value: formatCurrency(stats.sales_today ?? 0),
      helper: 'Same-day livestock revenue already reflected on the desk.',
      tone: 'teal',
    },
    {
      label: 'Medication Pressure',
      value: formatCurrency(stats.medication_cost_today ?? 0),
      helper: 'Treatment spend already logged across disease and medication records.',
      tone: 'amber',
    },
  ];
}

export function buildLivestockPenPayload(payload = {}) {
  return {
    ...payload,
    capacity: Number(payload.capacity || 0),
  };
}

export function buildLivestockGroupPayload(payload = {}) {
  return {
    ...payload,
    pen_id: payload.pen_id ? Number(payload.pen_id) : null,
    animal_count: Number(payload.animal_count || 0),
    average_weight_kg: Number(payload.average_weight_kg || 0),
  };
}

export function buildLivestockSalePayload(payload = {}) {
  return {
    ...payload,
    animal_group_id: payload.animal_group_id ? Number(payload.animal_group_id) : null,
    quantity: Number(payload.quantity || 0),
    revenue: Number(payload.revenue || 0),
  };
}

export function buildLivestockWeightPayload(payload = {}) {
  return {
    ...payload,
    animal_group_id: Number(payload.animal_group_id),
    weight_kg: Number(payload.weight_kg),
    sample_size: Number(payload.sample_size || 1),
  };
}

export function buildLivestockMilkPayload(payload = {}) {
  return {
    ...payload,
    animal_group_id: Number(payload.animal_group_id),
    litres: Number(payload.litres),
  };
}

export function buildLivestockDiseasePayload(payload = {}) {
  return {
    ...payload,
    animal_group_id: payload.animal_group_id ? Number(payload.animal_group_id) : null,
    affected_count: Number(payload.affected_count || 0),
  };
}

export function buildLivestockBreedingPayload(values = {}) {
  return {
    animal_group_id: Number(values.animal_group_id),
    cycle_name: values.cycle_name,
    paired_count: Number(values.paired_count || 0),
    successful_births: Number(values.successful_births || 0),
    expected_delivery_date: values.expected_delivery_date || null,
  };
}

export function buildLivestockMedicationPayload(values = {}) {
  return {
    animal_group_id: values.animal_group_id ? Number(values.animal_group_id) : null,
    medication_name: values.medication_name,
    treated_count: Number(values.treated_count || 0),
    cost: Number(values.cost || 0),
    administered_on: values.administered_on,
  };
}

export function filterLivestockGroups(groups = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return groups;

  return groups.filter((group) =>
    [
      group.name,
      group.species,
      group.breed,
      group.status,
      group.pen?.name,
      group.production_type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterLivestockOutbreaks(outbreaks = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return outbreaks;

  return outbreaks.filter((outbreak) =>
    [
      outbreak.disease_name,
      outbreak.severity,
      outbreak.status,
      outbreak.animal_group?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterLivestockSales(sales = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return sales;

  return sales.filter((sale) =>
    [
      sale.sale_type,
      sale.sold_on,
      sale.animal_group?.name,
      sale.customer_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function buildLivestockGroupCard(group = {}) {
  return {
    id: group.id,
    title: group.name,
    speciesLabel: `${group.species || 'Animal'}${group.breed ? ` | ${group.breed}` : ''}`,
    status: group.status,
    countLabel: group.animal_count ?? 0,
    weightLabel: `${group.average_weight_kg ?? 0} kg`,
    penLabel: group.pen?.name ?? 'Unassigned',
    productionLabel: group.production_type || 'General herd',
  };
}

export function buildLivestockOutbreakCard(outbreak = {}) {
  return {
    id: outbreak.id,
    title: outbreak.disease_name,
    detailLabel: `Severity: ${outbreak.severity} | Affected: ${outbreak.affected_count} | Status: ${outbreak.status}`,
    groupLabel: outbreak.animal_group?.name || 'Group pending',
  };
}

export function buildLivestockSaleCard(sale = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: sale.id,
    title: sale.sale_type,
    detailLabel: `Quantity: ${sale.quantity} | Revenue: ${formatCurrency(sale.revenue || 0)}`,
    groupLabel: sale.animal_group?.name || 'Mixed sale',
  };
}
