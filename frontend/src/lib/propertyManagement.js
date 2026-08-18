export const unitTypeOptions = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'shop', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
];

const UNIT_TYPE_LABELS = Object.fromEntries(unitTypeOptions.map((option) => [option.value, option.label]));

export function formatUnitType(unitType) {
  if (!unitType) return '';
  return UNIT_TYPE_LABELS[unitType] || unitType;
}

export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_TONE = {
  vacant: 'slate',
  occupied: 'emerald',
  maintenance: 'amber',
};

export function formatUnitStatus(status) {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function unitStatusTone(status) {
  return STATUS_TONE[status] || 'slate';
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function createPropertyUnitForm() {
  return {
    property_name: '',
    unit_type: 'apartment',
    address: '',
    bedrooms: '',
    rent_amount: '',
    service_charge_amount: '',
    notes: '',
  };
}

export function buildPropertyUnitPayload(form) {
  return {
    property_name: form.property_name,
    unit_type: form.unit_type,
    address: form.address || null,
    bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
    rent_amount: Number(form.rent_amount || 0),
    service_charge_amount: form.service_charge_amount === '' ? null : Number(form.service_charge_amount),
    notes: form.notes || null,
  };
}

export function createPropertyLeaseForm() {
  return {
    property_unit_id: '',
    customer_id: '',
    start_date: todayIso(),
    end_date: '',
    rent_amount: '',
    service_charge_amount: '',
    payment_frequency_days: '365',
    deposit_amount: '',
  };
}

export function buildPropertyLeasePayload(form) {
  return {
    property_unit_id: form.property_unit_id,
    customer_id: form.customer_id,
    start_date: form.start_date,
    end_date: form.end_date || null,
    rent_amount: Number(form.rent_amount || 0),
    service_charge_amount: form.service_charge_amount === '' ? null : Number(form.service_charge_amount),
    payment_frequency_days: Number(form.payment_frequency_days || 365),
    deposit_amount: form.deposit_amount === '' ? null : Number(form.deposit_amount),
  };
}

export function createMaintenanceRequestForm() {
  return {
    property_unit_id: '',
    title: '',
    details: '',
    priority: 'normal',
  };
}

export function buildMaintenanceRequestPayload(form) {
  return {
    property_unit_id: form.property_unit_id,
    title: form.title,
    details: form.details || null,
    priority: form.priority,
  };
}

export function buildPropertyOverviewMetrics(summary = {}, formatCurrency = (value) => String(value)) {
  return [
    { label: 'Occupied units', value: String(summary.occupied_units ?? 0), tone: 'emerald' },
    { label: 'Vacant units', value: String(summary.vacant_units ?? 0), tone: summary.vacant_units > 0 ? 'amber' : 'slate' },
    { label: 'Outstanding balance', value: formatCurrency(summary.total_outstanding_balance ?? 0), tone: summary.total_outstanding_balance > 0 ? 'amber' : 'emerald' },
    { label: 'Rent collected this month', value: formatCurrency(summary.rent_collected_this_month ?? 0), tone: 'emerald' },
    { label: 'Open maintenance requests', value: String(summary.open_maintenance_requests ?? 0), tone: summary.open_maintenance_requests > 0 ? 'rose' : 'slate' },
  ];
}

export function buildPropertyUnitCard(unit) {
  return {
    id: unit.id,
    unitCode: unit.unit_code,
    title: unit.property_name,
    unitTypeLabel: formatUnitType(unit.unit_type),
    addressLabel: unit.address || 'No address on file',
    statusLabel: formatUnitStatus(unit.status),
    statusTone: unitStatusTone(unit.status),
  };
}

export function buildPropertyLeaseCard(lease, formatCurrency = (value) => String(value)) {
  return {
    id: lease.id,
    customerName: lease.customer_name || 'Tenant',
    unitLabel: `${lease.property_name || 'Unit'} · ${lease.property_unit_code || ''}`.trim(),
    balanceLabel: formatCurrency(lease.balance ?? 0),
    hasBalance: Number(lease.balance ?? 0) > 0,
    statusLabel: formatUnitStatus(lease.status),
    nextDueLabel: lease.next_due_date ? `Next due ${lease.next_due_date}` : '',
  };
}

export function buildMaintenanceRequestCard(request) {
  return {
    id: request.id,
    title: request.title,
    unitCode: request.property_unit_code || '',
    priorityLabel: formatUnitStatus(request.priority),
    statusLabel: formatUnitStatus(request.status?.replace('_', ' ') || ''),
    detailsLabel: request.details || '',
  };
}
