import { formatCurrencyNGN } from './financeFormatters.js';

export function createSupplierForm() {
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contact_person: '',
    is_active: true,
  };
}

export function buildSupplierPayload(form = {}) {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    contact_person: form.contact_person.trim() || null,
    is_active: Boolean(form.is_active),
  };
}

export function buildSupplierOverviewMetrics(suppliers = [], formatCurrency = formatCurrencyNGN) {
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active !== false);
  const withEmail = suppliers.filter((supplier) => Boolean(supplier.email)).length;
  const withPhone = suppliers.filter((supplier) => Boolean(supplier.phone)).length;
  const totalBalance = suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0);
  const latestSupplier = [...suppliers]
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))[0];

  return [
    {
      label: 'Active Suppliers',
      value: activeSuppliers.length,
      helper: 'Vendors currently available for purchasing and settlement workflows.',
      tone: 'emerald',
    },
    {
      label: 'Email Coverage',
      value: withEmail,
      helper: 'Suppliers with direct email contact ready for purchase follow-up.',
      tone: 'sky',
    },
    {
      label: 'Phone Coverage',
      value: withPhone,
      helper: 'Suppliers reachable quickly when stock pressure needs fast action.',
      tone: 'amber',
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(totalBalance),
      helper: 'Current supplier exposure recorded on the vendor ledger.',
      tone: totalBalance > 0 ? 'rose' : 'violet',
    },
    {
      label: 'Latest Supplier',
      value: latestSupplier?.name || 'No suppliers yet',
      helper: latestSupplier?.city || latestSupplier?.state
        ? `${latestSupplier.city || 'Unknown city'}${latestSupplier.state ? `, ${latestSupplier.state}` : ''}`
        : 'No vendor locations recorded yet.',
      tone: latestSupplier ? 'violet' : 'slate',
    },
  ];
}

export function buildSupplierCard(supplier = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: supplier.id,
    title: supplier.name || 'Supplier',
    initial: supplier.name?.charAt(0)?.toUpperCase() || 'S',
    phoneLabel: supplier.phone || 'No phone',
    emailLabel: supplier.email || 'No email',
    addressLabel: supplier.address || 'No address captured',
    locationLabel: [supplier.city, supplier.state].filter(Boolean).join(', ') || 'No city/state captured',
    contactPersonLabel: supplier.contact_person || 'No contact person',
    balanceLabel: formatCurrency(supplier.balance || 0),
    statusLabel: supplier.is_active === false ? 'Inactive' : 'Active',
  };
}

export function filterSuppliers(suppliers = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return suppliers;
  }

  return suppliers.filter((supplier) => {
    const fields = [
      supplier.name,
      supplier.email,
      supplier.phone,
      supplier.address,
      supplier.city,
      supplier.state,
      supplier.contact_person,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}
